import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { findApprovedConflicts, describeConflicts, toHHMM } from "@/lib/practicum/schedule";

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

  // Menyetujui = mengunci slot lab. Tolak kalau jadwalnya bentrok dengan
  // kegiatan lain yang SUDAH disetujui di lab & tanggal yang sama (kalau
  // tidak, dua kegiatan bisa sama-sama "Disetujui" di jam yang tumpang
  // tindih). Sesi admin bisa melihat semua pengajuan lewat RLS.
  if (status === "approved") {
    const { data: target, error: targetError } = await supabase
      .from("practicum_requests")
      .select("id, lokasi, tanggal, jam_mulai, jam_selesai")
      .eq("id", params.id)
      .single();

    if (targetError || !target) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
    }

    const jamMulai = toHHMM(target.jam_mulai);
    const jamSelesai = toHHMM(target.jam_selesai);
    if (target.lokasi && jamMulai && jamSelesai) {
      const { data: conflicts, error: conflictError } = await findApprovedConflicts(supabase, {
        lokasi: target.lokasi,
        tanggal: target.tanggal,
        jamMulai,
        jamSelesai,
        excludeId: params.id,
      });
      if (conflictError) {
        console.error("Cek bentrok saat approve error", conflictError);
        return NextResponse.json({ error: "Gagal memeriksa bentrok jadwal." }, { status: 500 });
      }
      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: `Tidak bisa disetujui: bentrok dengan kegiatan yang sudah disetujui di ${target.lokasi} (${describeConflicts(conflicts)}).`,
          },
          { status: 409 }
        );
      }
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
