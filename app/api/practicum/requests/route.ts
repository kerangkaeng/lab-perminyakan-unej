import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";

const NON_PRAKTIKUM_VALUES = [
  "penelitian_riset",
  "seminar_kp",
  "seminar_hasil",
  "bimbingan_akademik",
  "kegiatan_akademik",
  "lainnya",
];

export async function POST(req: NextRequest) {
  const session = await getSession();
  const token = getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const {
    jenis_kegiatan,
    praktikum_nama,
    modul,
    lokasi,
    kegiatan_non_praktikum,
    deskripsi_lainnya,
    tanggal,
    jam_mulai,
    jam_selesai,
  } = body ?? {};

  if (!tanggal || !jam_mulai || !jam_selesai) {
    return NextResponse.json({ error: "Mohon lengkapi tanggal dan jam kegiatan." }, { status: 400 });
  }

  if (jenis_kegiatan !== "praktikum" && jenis_kegiatan !== "non_praktikum") {
    return NextResponse.json({ error: "Jenis kegiatan tidak valid." }, { status: 400 });
  }

  const insertPayload: Record<string, unknown> = {
    requester_id: session.usersId,
    jenis_kegiatan,
    tanggal,
    jam_mulai,
    jam_selesai,
  };

  if (jenis_kegiatan === "praktikum") {
    if (!praktikum_nama || !modul || !lokasi) {
      return NextResponse.json(
        { error: "Mohon lengkapi praktikum, modul, dan laboratorium." },
        { status: 400 }
      );
    }
    insertPayload.praktikum_nama = praktikum_nama;
    insertPayload.modul = modul;
    insertPayload.lokasi = lokasi;
  } else {
    if (!kegiatan_non_praktikum || !NON_PRAKTIKUM_VALUES.includes(kegiatan_non_praktikum)) {
      return NextResponse.json({ error: "Mohon pilih jenis kegiatan non-praktikum." }, { status: 400 });
    }
    if (kegiatan_non_praktikum === "lainnya" && !deskripsi_lainnya) {
      return NextResponse.json(
        { error: "Mohon isi deskripsi kegiatan untuk kategori Lainnya." },
        { status: 400 }
      );
    }
    insertPayload.kegiatan_non_praktikum = kegiatan_non_praktikum;
    insertPayload.deskripsi_lainnya = kegiatan_non_praktikum === "lainnya" ? deskripsi_lainnya : null;
  }

  const supabase = supabaseAuthed(token);

  // requester_id dikirim sebagai users.id milik sesi ini; RLS tetap
  // memvalidasi ulang lewat subquery auth.uid() jadi aman meski nilai ini
  // dipalsukan dari client.
  const { data, error } = await supabase
    .from("practicum_requests")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Insert practicum_request error", error);
    return NextResponse.json({ error: "Gagal menyimpan pengajuan." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
