import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { isSignatureKey } from "@/lib/storage/b2";
import { loadUserStaffSlots } from "@/lib/loans/approvers";
import type { LoanRecord } from "@/lib/loans/config";

// Keputusan Kepala Lab / Laboran atas peminjaman berstatus "menunggu_acc".
//   POST { action: "approve" | "reject", catatan?: string }
// Hak memutuskan ditentukan dari jabatan di lab_roles (kepala_lab/laboran per
// bidang), BUKAN dari users.role: Kepala Lab Reservoir tidak bisa memutuskan
// slot Lab Pemboran & Produksi. Satu orang yang memegang beberapa jabatan
// menyelesaikan semua slot pending miliknya sekaligus.
//   approve : slot milik user -> approved (menyimpan approver_id = siapa yang ACC,
//             dipakai untuk tanda tangan di surat persetujuan). Bila semua slot
//             approved -> peminjaman "disetujui".
//   reject  : wajib catatan (>= 5 karakter); slot -> rejected, peminjaman "ditolak"
//             (pengaju bisa mengunggah ulang dokumen).

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const catatan = typeof body?.catatan === "string" ? body.catatan.trim() : "";
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  }
  if (action === "reject" && (catatan.length < 5 || catatan.length > 500)) {
    return NextResponse.json({ error: "Tulis alasan penolakan (5–500 karakter)." }, { status: 400 });
  }

  const db = supabaseServer();

  const { data: loanData, error: loanErr } = await db.from("equipment_loans").select("*").eq("id", id).maybeSingle();
  if (loanErr) {
    console.error("Ambil equipment_loans error", loanErr);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  const loan = loanData as LoanRecord | null;
  if (!loan) return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  if (loan.status !== "menunggu_acc") {
    return NextResponse.json({ error: "Peminjaman ini tidak sedang menunggu persetujuan." }, { status: 409 });
  }

  let slots;
  try {
    slots = await loadUserStaffSlots(db, session.usersId);
  } catch (e) {
    console.error("loadUserStaffSlots error", e);
    return NextResponse.json({ error: "Gagal memeriksa jabatan kamu." }, { status: 500 });
  }

  const { data: pendingData, error: pendErr } = await db
    .from("equipment_loan_approvals")
    .select("id, role_type, bidang")
    .eq("loan_id", loan.id)
    .eq("status", "pending");
  if (pendErr) {
    console.error("Ambil equipment_loan_approvals error", pendErr);
    return NextResponse.json({ error: "Gagal memuat data persetujuan." }, { status: 500 });
  }
  const mine = ((pendingData ?? []) as { id: string; role_type: string; bidang: string }[]).filter((p) =>
    slots.some((s) => s.role_type === p.role_type && s.bidang === p.bidang)
  );
  if (mine.length === 0) {
    return NextResponse.json({ error: "Tidak ada persetujuan yang menunggu keputusan kamu pada peminjaman ini." }, { status: 403 });
  }

  const now = new Date().toISOString();
  const mineIds = mine.map((m) => m.id);

  if (action === "approve") {
    // Tanda tangan elektronik dipakai di surat persetujuan: wajib sudah diunggah.
    const { data: me } = await db.from("users").select("id, ttd").eq("id", session.usersId).single();
    if (!me || !isSignatureKey(me.ttd as string | null, session.usersId)) {
      return NextResponse.json(
        { error: "Unggah tanda tangan kamu di halaman Profil dulu; tanda tangan itu dipakai pada surat persetujuan." },
        { status: 400 }
      );
    }

    const { data: done, error: updErr } = await db
      .from("equipment_loan_approvals")
      .update({ status: "approved", approver_id: session.usersId, decided_at: now, catatan: null })
      .in("id", mineIds)
      .eq("status", "pending")
      .select("id");
    if (updErr || !done || done.length === 0) {
      console.error("Update persetujuan (approve) error", updErr);
      return NextResponse.json({ error: "Gagal menyimpan persetujuan. Muat ulang halaman lalu coba lagi." }, { status: 500 });
    }

    const { count, error: cntErr } = await db
      .from("equipment_loan_approvals")
      .select("id", { count: "exact", head: true })
      .eq("loan_id", loan.id)
      .neq("status", "approved");
    if (cntErr) {
      console.error("Hitung sisa persetujuan error", cntErr);
      return NextResponse.json({ error: "Persetujuan tersimpan, tetapi gagal memperbarui status. Muat ulang halaman." }, { status: 500 });
    }
    if ((count ?? 0) === 0) {
      const { error: loanUpd } = await db
        .from("equipment_loans")
        .update({ status: "disetujui", approved_at: now })
        .eq("id", loan.id)
        .eq("status", "menunggu_acc");
      if (loanUpd) {
        console.error("Update status disetujui error", loanUpd);
        return NextResponse.json({ error: "Persetujuan tersimpan, tetapi gagal memperbarui status. Muat ulang halaman." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, status: "disetujui" });
    }
    return NextResponse.json({ ok: true, status: "menunggu_acc" });
  }

  // reject
  const { data: rejected, error: rejErr } = await db
    .from("equipment_loan_approvals")
    .update({ status: "rejected", approver_id: session.usersId, decided_at: now, catatan })
    .in("id", mineIds)
    .eq("status", "pending")
    .select("id");
  if (rejErr || !rejected || rejected.length === 0) {
    console.error("Update persetujuan (reject) error", rejErr);
    return NextResponse.json({ error: "Gagal menyimpan penolakan. Muat ulang halaman lalu coba lagi." }, { status: 500 });
  }
  const { error: loanRej } = await db
    .from("equipment_loans")
    .update({ status: "ditolak", rejected_at: now, catatan_penolakan: catatan })
    .eq("id", loan.id)
    .eq("status", "menunggu_acc");
  if (loanRej) {
    console.error("Update status ditolak error", loanRej);
    return NextResponse.json({ error: "Penolakan tersimpan, tetapi gagal memperbarui status. Muat ulang halaman." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status: "ditolak" });
}
