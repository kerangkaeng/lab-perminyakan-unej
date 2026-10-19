import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { deletePrivateFile, fetchPrivateFileForProxy, sniffUploadType, uploadPrivateFile } from "@/lib/storage/b2";
import { MAX_LOAN_SCAN_BYTES, type LoanRecord } from "@/lib/loans/config";
import { resetApprovalSlots } from "@/lib/loans/approvers";
import { canViewLoan, loadLoanReviewer } from "@/lib/loans/access";

// Dokumen peminjaman yang SUDAH ditandatangani basah (scan/foto), diunggah
// pengaju di /peminjaman/status. Disimpan di bucket privat.
//   POST : pengaju mengunggah (status menunggu_upload atau ditolak -> menunggu_acc;
//          semua persetujuan di-reset ke "pending").
//   GET  : melihat berkas — pengaju sendiri, admin, atau Kepala Lab/Laboran bidang terkait.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_LABEL = "PDF, JPG, atau PNG";

async function loadLoan(id: string) {
  const { data, error } = await supabaseServer().from("equipment_loans").select("*").eq("id", id).maybeSingle();
  return { loan: (data as LoanRecord | null) ?? null, error };
}

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const { loan, error } = await loadLoan(id);
  if (error) {
    console.error("Ambil equipment_loans error", error);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  if (!loan || loan.requester_id !== session.usersId) {
    return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  }
  if (loan.status !== "menunggu_upload" && loan.status !== "ditolak") {
    return NextResponse.json(
      { error: "Dokumen tidak bisa diunggah pada status ini (sudah menunggu persetujuan atau sudah disetujui)." },
      { status: 409 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Pilih berkas dokumen yang sudah ditandatangani." }, { status: 400 });
  }
  if (file.size > MAX_LOAN_SCAN_BYTES) {
    return NextResponse.json(
      {
        error: `Ukuran file maks. ${MAX_LOAN_SCAN_BYTES / (1024 * 1024)} MB. Ukuran file kamu: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
      },
      { status: 400 }
    );
  }

  // Tipe ditentukan dari ISI berkas (magic bytes), bukan dari nama/Content-Type kiriman klien.
  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffUploadType(buf, file.name);
  if (!sniffed || !ALLOWED_MIME.includes(sniffed.mime)) {
    return NextResponse.json({ error: `Berkas harus berupa ${ALLOWED_LABEL}.` }, { status: 400 });
  }

  const key = `loan-docs/${loan.id}/signed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sniffed.ext}`;
  try {
    await uploadPrivateFile(buf, key, sniffed.mime);
  } catch (e) {
    console.error("Upload dokumen peminjaman error", e);
    return NextResponse.json({ error: "Gagal mengunggah berkas. Silakan coba lagi." }, { status: 500 });
  }

  const db = supabaseServer();
  // Guard status di UPDATE supaya dua unggahan bersamaan / unggah setelah ACC tidak menimpa.
  const { data: updated, error: updErr } = await db
    .from("equipment_loans")
    .update({
      signed_doc_key: key,
      signed_doc_mime: sniffed.mime,
      signed_uploaded_at: new Date().toISOString(),
      status: "menunggu_acc",
      catatan_penolakan: null,
      rejected_at: null,
    })
    .eq("id", loan.id)
    .in("status", ["menunggu_upload", "ditolak"])
    .select("id");
  if (updErr || !updated || updated.length === 0) {
    console.error("Update equipment_loans (upload) error", updErr);
    await deletePrivateFile(key).catch(() => {});
    return NextResponse.json({ error: "Gagal menyimpan dokumen. Muat ulang halaman lalu coba lagi." }, { status: 500 });
  }

  try {
    // Pengajuan baru/unggah ulang -> semua penyetujui mulai dari "pending".
    await resetApprovalSlots(db, loan.id, loan.bidang);
  } catch (e) {
    console.error("Reset slot persetujuan error", e);
    return NextResponse.json({ error: "Dokumen tersimpan, tetapi gagal menyiapkan persetujuan. Hubungi admin." }, { status: 500 });
  }

  // Bersihkan berkas lama (unggah ulang setelah ditolak). Gagal menghapus tidak fatal.
  if (loan.signed_doc_key && loan.signed_doc_key !== key) {
    await deletePrivateFile(loan.signed_doc_key).catch((e) => console.error("Hapus berkas lama gagal", e));
  }

  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const { loan, error } = await loadLoan(id);
  if (error) {
    console.error("Ambil equipment_loans error", error);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  if (!loan) return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  if (loan.requester_id !== session.usersId) {
    let allowed = false;
    try {
      const reviewer = await loadLoanReviewer(supabaseServer(), session);
      allowed = canViewLoan(reviewer, session, loan);
    } catch (e) {
      console.error("loadLoanReviewer error", e);
    }
    if (!allowed) return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
  }
  if (!loan.signed_doc_key || !loan.signed_doc_mime || !ALLOWED_MIME.includes(loan.signed_doc_mime)) {
    return NextResponse.json({ error: "Belum ada dokumen yang diunggah." }, { status: 404 });
  }

  const file = await fetchPrivateFileForProxy(loan.signed_doc_key);
  if (!file) return NextResponse.json({ error: "Dokumen tidak ditemukan di penyimpanan." }, { status: 404 });

  const ext = loan.signed_doc_mime === "application/pdf" ? "pdf" : loan.signed_doc_mime === "image/png" ? "png" : "jpg";
  return new NextResponse(Buffer.from(file.body) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": loan.signed_doc_mime,
      "Content-Disposition": `inline; filename="Peminjaman-Bertandatangan-${loan.id.slice(0, 8)}.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
