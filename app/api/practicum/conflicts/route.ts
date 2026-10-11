import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { toHHMM } from "@/lib/practicum/schedule";

// GET /api/practicum/conflicts?lokasi=...&tanggal=YYYY-MM-DD&jam_mulai=HH:MM&jam_selesai=HH:MM
//
// Dipakai form pengajuan untuk MENAMPILKAN PERINGATAN kalau sudah ada kegiatan
// (disetujui / menunggu) di lab & jam yang sama. Hanya peringatan: pengajuan
// tetap boleh dikirim. Klien mahasiswa tidak bisa membaca pengajuan orang lain
// (RLS), jadi pengecekan lewat server dengan service role. Yang dikembalikan
// hanya info kegiatan (tanpa data pengaju).

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const lokasi = sp.get("lokasi")?.trim();
  const tanggal = sp.get("tanggal") ?? "";
  const jamMulai = toHHMM(sp.get("jam_mulai"));
  const jamSelesai = toHHMM(sp.get("jam_selesai"));

  if (!lokasi || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !jamMulai || !jamSelesai || jamMulai >= jamSelesai) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabaseServer()
    .from("practicum_requests")
    .select(
      "id, jenis_kegiatan, praktikum_nama, modul, kegiatan_non_praktikum, deskripsi_lainnya, jam_mulai, jam_selesai, status"
    )
    .in("status", ["approved", "pending"])
    .eq("lokasi", lokasi)
    .eq("tanggal", tanggal)
    .lt("jam_mulai", jamSelesai)
    .gt("jam_selesai", jamMulai);

  if (error) {
    console.error("Cek bentrok (peringatan) error", error);
    return NextResponse.json({ data: [] });
  }

  const rows = (data ?? []).map((r) => ({
    ...r,
    jam_mulai: toHHMM(r.jam_mulai) ?? r.jam_mulai,
    jam_selesai: toHHMM(r.jam_selesai) ?? r.jam_selesai,
  }));
  return NextResponse.json({ data: rows });
}
