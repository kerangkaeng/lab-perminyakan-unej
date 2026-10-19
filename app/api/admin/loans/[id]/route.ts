import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { LoanRecord } from "@/lib/loans/config";

// Hapus pengajuan peminjaman — HANYA admin, dan HANYA yang masih "menunggu_upload"
// (pengaju belum mengunggah dokumen bertanda tangan), mis. salah isi form.
// Baris equipment_loans (dan slot persetujuannya, kalau ada) dihapus permanen dari database.
//   DELETE /api/admin/loans/<id>

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;

export async function DELETE(_req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  // getSession membaca role terbaru dari database, jadi pencabutan akses admin langsung berlaku.
  if (session.appRole !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat menghapus pengajuan." }, { status: 403 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  const db = supabaseServer();
  const { data, error } = await db.from("equipment_loans").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Ambil equipment_loans error", error);
    return NextResponse.json({ error: "Gagal memuat data peminjaman." }, { status: 500 });
  }
  const loan = data as LoanRecord | null;
  if (!loan) return NextResponse.json({ error: "Peminjaman tidak ditemukan." }, { status: 404 });
  if (loan.status !== "menunggu_upload" || loan.signed_doc_key) {
    return NextResponse.json(
      { error: "Hanya pengajuan yang belum mengunggah dokumen yang dapat dihapus." },
      { status: 409 }
    );
  }

  // Slot persetujuan dihapus lebih dulu (tidak bergantung pada ON DELETE CASCADE).
  const delApprovals = await db.from("equipment_loan_approvals").delete().eq("loan_id", loan.id);
  if (delApprovals.error) {
    console.error("Hapus equipment_loan_approvals error", delApprovals.error);
    return NextResponse.json({ error: "Gagal menghapus data persetujuan." }, { status: 500 });
  }

  // Guard status di DELETE: kalau pengaju keburu mengunggah, baris tidak ikut terhapus.
  const { data: deleted, error: delErr } = await db
    .from("equipment_loans")
    .delete()
    .eq("id", loan.id)
    .eq("status", "menunggu_upload")
    .is("signed_doc_key", null)
    .select("id");
  if (delErr) {
    console.error("Hapus equipment_loans error", delErr);
    return NextResponse.json({ error: "Gagal menghapus pengajuan." }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Pengajuan sudah berubah status. Muat ulang halaman." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
