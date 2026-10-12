import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { supabaseServer } from "@/lib/supabase/server";
import { validateSchedule } from "@/lib/practicum/schedule";
import { getSubmissionBlock } from "@/lib/practicum/submissionBlock";

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
  const token = await getSessionToken();

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

  // Validasi jadwal di server (browser hanya memberi peringatan, dan bisa
  // dilewati): format, jam selesai > jam mulai, tanggal tidak boleh lewat.
  const schedule = validateSchedule(tanggal, jam_mulai, jam_selesai);
  if ("error" in schedule) {
    return NextResponse.json({ error: schedule.error }, { status: 400 });
  }
  const { jamMulai, jamSelesai } = schedule.ok;

  if (typeof lokasi !== "string" || !lokasi.trim()) {
    return NextResponse.json({ error: "Laboratorium tidak valid." }, { status: 400 });
  }

  // Pakai service role: klien mahasiswa tidak bisa melihat pengajuan orang
  // lain (RLS), jadi pengecekan lokasi & bentrok harus dari sisi server.
  const admin = supabaseServer();

  const { data: facility, error: facilityError } = await admin
    .from("facilities")
    .select("name")
    .eq("name", lokasi)
    .limit(1)
    .maybeSingle();
  if (facilityError) {
    console.error("Cek laboratorium error", facilityError);
    return NextResponse.json({ error: "Gagal memvalidasi laboratorium." }, { status: 500 });
  }
  if (!facility) {
    return NextResponse.json({ error: "Laboratorium tidak dikenal." }, { status: 400 });
  }

  // Bentrok jadwal dengan kegiatan lain di lab yang sama SENGAJA tidak
  // memblokir: beberapa kegiatan boleh berlangsung bersamaan. Pengaju hanya
  // diberi peringatan di form (lihat /api/practicum/conflicts).

  const insertPayload: Record<string, unknown> = {
    requester_id: session.usersId,
    jenis_kegiatan,
    tanggal: schedule.ok.tanggal,
    jam_mulai: jamMulai,
    jam_selesai: jamSelesai,
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

  // Blokir pengajuan baru kalau pengaju masih punya administrasi yang belum
  // beres: (1) revisi sudah dikirim tapi belum di-ACC admin/asisten, (2) revisi
  // diminta tapi belum dikirim, atau (3) kegiatan sudah lewat tapi administrasi
  // belum dilengkapi. Logic-nya satu sumber di lib/practicum/submissionBlock.ts
  // (dipakai juga halaman Ajukan Kegiatan untuk peringatan di depan).
  const block = await getSubmissionBlock(supabase, session.usersId);
  if (block) {
    return NextResponse.json({ error: block.message, reason: block.reason }, { status: 400 });
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
