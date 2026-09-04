import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const token = getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { praktikum_nama, modul, tanggal, jam_mulai, jam_selesai, lokasi } = body ?? {};

  if (!praktikum_nama || !modul || !tanggal || !jam_mulai || !jam_selesai) {
    return NextResponse.json({ error: "Mohon lengkapi semua data wajib." }, { status: 400 });
  }

  const supabase = supabaseAuthed(token);

  // requester_id dikirim sebagai users.id milik sesi ini; RLS tetap
  // memvalidasi ulang lewat subquery auth.uid() jadi aman meski nilai ini
  // dipalsukan dari client.
  const { data, error } = await supabase
    .from("practicum_requests")
    .insert({
      requester_id: session.usersId,
      praktikum_nama,
      modul,
      tanggal,
      jam_mulai,
      jam_selesai,
      lokasi: lokasi || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert practicum_request error", error);
    return NextResponse.json({ error: "Gagal menyimpan pengajuan." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
