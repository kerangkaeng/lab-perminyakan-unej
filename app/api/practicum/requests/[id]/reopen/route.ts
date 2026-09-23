import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";

// PATCH /api/admin/practicum-requests/[id]/reopen
// Admin membuka kembali administrasi yang sudah "completed" supaya pengaju
// bisa merevisi (mis. salah pilih alat/bahan atau salah jumlah).
//
// Sengaja HANYA mengubah `completed` jadi false. Semua data yang sudah
// diisi sebelumnya (insiden_*, peminjaman_*, doc_*) TIDAK dihapus/dikosongkan
// — biar CompletionModal bisa prefill dari data itu, dan supaya kalau
// pengaju tidak jadi merevisi, data lama tetap ada (bukan hilang begitu saja).
// `completed_at` juga sengaja tidak diubah, dipakai sebagai penanda
// "request ini pernah completed sebelumnya" (revisi) vs "belum pernah
// completed sama sekali" (pengisian pertama kali) di frontend.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  // Sama seperti route admin lain: pengecekan ini cuma untuk pesan error
  // yang jelas di UI. Enforcement sesungguhnya tetap harus ada di RLS
  // policy Supabase (practicum_requests, kolom `completed` hanya bisa
  // diubah oleh admin ATAU oleh requester_id sendiri saat mengisi
  // administrasi pertama kali — sesuaikan dengan policy yang sudah ada).
  if (session.appRole !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang bisa melakukan aksi ini." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const catatanRevisi: string | undefined = body?.catatan;

  const supabase = supabaseAuthed(token);

  const { data: reqRow, error: fetchError } = await supabase
    .from("practicum_requests")
    .select("id, completed, catatan_admin")
    .eq("id", params.id)
    .single();

  if (fetchError || !reqRow) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }
  if (!reqRow.completed) {
    return NextResponse.json(
      { error: "Administrasi kegiatan ini belum ditandai selesai, tidak perlu dibuka untuk revisi." },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = { completed: false };
  if (catatanRevisi && catatanRevisi.trim()) {
    const prefix = "[Revisi diminta] ";
    updatePayload.catatan_admin = `${prefix}${catatanRevisi.trim()}`;
  }

  const { data, error } = await supabase
    .from("practicum_requests")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Reopen practicum_request error", error);
    return NextResponse.json({ error: "Gagal membuka kembali administrasi." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
