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

  if (!tanggal || !jam_mulai || !jam_selesai || !lokasi) {
    return NextResponse.json({ error: "Mohon lengkapi tanggal, jam, dan laboratorium." }, { status: 400 });
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
    lokasi,
  };

  if (jenis_kegiatan === "praktikum") {
    if (!praktikum_nama || !modul) {
      return NextResponse.json(
        { error: "Mohon lengkapi praktikum dan modul." },
        { status: 400 }
      );
    }
    insertPayload.praktikum_nama = praktikum_nama;
    insertPayload.modul = modul;
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

  // Blokir pengajuan baru kalau masih ada kegiatan DISETUJUI yang sudah
  // LEWAT TANGGAL/JAMNYA tapi administrasinya belum diselesaikan (upload
  // dokumentasi + lapor insiden). Berlaku lintas jenis kegiatan (praktikum
  // maupun non-praktikum dihitung bersama).
  const { data: pendingAdmin } = await supabase
    .from("practicum_requests")
    .select("id, tanggal, jam_selesai")
    .eq("requester_id", session.usersId)
    .eq("status", "approved")
    .eq("completed", false);

  const now = new Date();
  const hasOverdueAdmin = (pendingAdmin ?? []).some((r) => {
    // Kegiatan disimpan dalam waktu lokal WIB (UTC+7), Jember/UNEJ.
    const activityEnd = new Date(`${r.tanggal}T${r.jam_selesai}:00+07:00`);
    return activityEnd.getTime() < now.getTime();
  });

  if (hasOverdueAdmin) {
    return NextResponse.json(
      {
        error:
          "Kamu masih punya kegiatan yang sudah selesai tapi administrasinya belum dilengkapi. Mohon selesaikan dulu lewat menu Status Pengajuan sebelum mengajukan kegiatan baru.",
      },
      { status: 400 }
    );
  }

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
