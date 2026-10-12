import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { approvalLockReason } from "@/lib/admin/rejectRules";

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  // Pengecekan role di sini murni untuk pesan error yang jelas di UI —
  // enforcement yang sesungguhnya tetap di RLS (requests_update_admin_only),
  // jadi meskipun app_role di token dipalsukan, query akan tetap ditolak
  // Supabase kalau is_admin() bernilai false di database.
  if (session.appRole !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa melakukan aksi ini." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { status, catatan_admin } = body ?? {};

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  const supabase = supabaseAuthed(token);

  // Ambil kondisi pengajuan saat ini (sesi admin bisa melihat semua lewat RLS)
  // untuk menjaga konsistensi perpindahan status & bentrok jadwal.
  const { data: target, error: targetError } = await supabase
    .from("practicum_requests")
    .select(
      "id, status, completed, lokasi, tanggal, jam_mulai, jam_selesai, doc_pretest, doc_tes_alat, doc_praktikum, doc_kegiatan, insiden_dokumentasi"
    )
    .eq("id", params.id)
    .single();

  if (targetError || !target) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }

  if (target.status === status) {
    return NextResponse.json(
      { error: `Pengajuan ini sudah berstatus ${status === "approved" ? "disetujui" : "ditolak"}.` },
      { status: 400 }
    );
  }

  // Membatalkan persetujuan (approved -> rejected) hanya boleh selama pengaju
  // belum mengunggah dokumentasi / menyelesaikan administrasi. Aturannya satu
  // sumber di lib/admin/rejectRules.ts (tombol Tolak di UI memakai yang sama).
  if (target.status === "approved" && status === "rejected") {
    const lockReason = approvalLockReason(target);
    if (lockReason) {
      return NextResponse.json({ error: lockReason }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("practicum_requests")
    .update({
      status,
      catatan_admin: catatan_admin || null,
      reviewed_by: session.usersId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Update practicum_request error", error);
    return NextResponse.json({ error: "Gagal memperbarui status pengajuan." }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  // Sama seperti PATCH: pengecekan ini cuma untuk pesan error yang jelas.
  // Enforcement sesungguhnya ada di RLS policy requests_delete_admin_only
  // (lihat supabase/migrations/002_practicum_requests_delete.sql).
  if (session.appRole !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa melakukan aksi ini." }, { status: 403 });
  }

  const supabase = supabaseAuthed(token);
  const { error } = await supabase
    .from("practicum_requests")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Delete practicum_request error", error);
    return NextResponse.json({ error: "Gagal menghapus pengajuan." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
