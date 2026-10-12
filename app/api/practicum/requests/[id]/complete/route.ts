import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { supabaseServer } from "@/lib/supabase/server";
import { SATUAN_ALAT, SATUAN_BAHAN } from "@/lib/constants/kegiatan";
import { wibDateTime } from "@/lib/practicum/schedule";

const INSIDEN_VALUES = ["rusak_pecah", "hilang", "tumpah", "lainnya"];

// Batas wajar peminjaman per kegiatan — mencegah payload JSON raksasa.
const MAX_PINJAM_ITEMS = 50;
const MAX_PINJAM_JUMLAH = 100000;

type PinjamItem = { equipment_id: string; equipment_name: string; jumlah: number; satuan: string };

/**
 * Validasi + bersihkan daftar peminjaman. Hanya field yang dikenal yang
 * disimpan (bukan objek mentah dari client), `equipment_id` harus ada di
 * tabel equipment dengan jenis yang sesuai (alat/bahan), satuan harus salah
 * satu dari daftar resmi, dan nama alat diambil dari database (bukan
 * kiriman client). Melempar Error berisi pesan untuk pengguna kalau invalid.
 */
async function cleanPinjamItems(items: unknown, kind: "alat" | "bahan"): Promise<PinjamItem[]> {
  const label = kind;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Mohon tambahkan minimal satu ${label} yang dipinjam.`);
  }
  if (items.length > MAX_PINJAM_ITEMS) {
    throw new Error(`Maksimal ${MAX_PINJAM_ITEMS} ${label} dalam satu kegiatan.`);
  }
  const allowedSatuan: readonly string[] = kind === "alat" ? SATUAN_ALAT : SATUAN_BAHAN;

  const raw: { equipment_id: string; jumlah: number; satuan: string }[] = [];
  for (const item of items) {
    const it = item as Record<string, unknown> | null;
    const equipmentId = typeof it?.equipment_id === "string" ? it.equipment_id.trim() : "";
    const jumlah = it?.jumlah;
    const satuan = typeof it?.satuan === "string" ? it.satuan.trim() : "";
    if (
      !equipmentId ||
      typeof jumlah !== "number" ||
      !Number.isFinite(jumlah) ||
      !(jumlah > 0) ||
      jumlah > MAX_PINJAM_JUMLAH ||
      !allowedSatuan.includes(satuan)
    ) {
      throw new Error(`Mohon lengkapi pilihan ${label}, jumlah (angka > 0), dan satuan yang valid.`);
    }
    raw.push({ equipment_id: equipmentId, jumlah, satuan });
  }

  const ids = Array.from(new Set(raw.map((r) => r.equipment_id)));
  const { data: rows, error } = await supabaseServer()
    .from("equipment")
    .select("id, name")
    .in("id", ids)
    .eq("jenis", kind);
  if (error) {
    console.error("Validasi equipment peminjaman error", error);
    throw new Error("Gagal memvalidasi data peminjaman. Silakan coba lagi.");
  }
  const nameById = new Map<string, string>((rows ?? []).map((r: { id: string; name: string }) => [r.id, r.name]));
  if (nameById.size !== ids.length) {
    throw new Error(`Ada ${label} yang tidak ditemukan atau bukan berjenis ${label}. Muat ulang halaman lalu pilih lagi.`);
  }

  return raw.map((r) => ({ ...r, equipment_name: nameById.get(r.equipment_id) ?? "" }));
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const session = await getSession();
  const token = await getSessionToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const {
    ada_insiden,
    insiden_jenis,
    insiden_jenis_lainnya,
    insiden_nama_alat,
    insiden_jumlah,
    insiden_penyebab,
    insiden_pihak_terkait,
    insiden_tanggung_jawab,
    ada_peminjaman,
    pinjam_alat,
    pinjam_bahan,
    peminjaman_alat,
    peminjaman_bahan,
  } = body ?? {};

  const supabase = supabaseAuthed(token);

  const { data: reqRow, error: fetchError } = await supabase
    .from("practicum_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !reqRow) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }
  if (reqRow.requester_id !== session.usersId) {
    return NextResponse.json({ error: "Kamu tidak berhak menyelesaikan pengajuan ini." }, { status: 403 });
  }
  if (reqRow.status !== "approved") {
    return NextResponse.json({ error: "Pengajuan belum disetujui admin." }, { status: 400 });
  }
  if (reqRow.completed) {
    return NextResponse.json({ error: "Administrasi kegiatan ini sudah selesai." }, { status: 400 });
  }
  // Revisi yang sudah dikirim tidak boleh diubah lagi selagi dicek admin/asisten.
  if ((reqRow as any).revisi_diajukan_at) {
    return NextResponse.json(
      { error: "Revisi sudah dikirim dan sedang menunggu verifikasi admin/asisten." },
      { status: 409 }
    );
  }
  // completed=false + completed_at terisi = administrasi pernah selesai lalu
  // dibuka kembali untuk revisi. Revisi TIDAK langsung "Selesai": harus
  // diverifikasi (ACC) admin/asisten dulu.
  const isRevision = !!reqRow.completed_at;

  // Administrasi baru boleh diselesaikan setelah kegiatannya selesai (WIB);
  // kalau tidak, pengaju bisa menandai selesai sebelum kegiatan terjadi.
  const activityEnd = wibDateTime(reqRow.tanggal, reqRow.jam_selesai);
  if (activityEnd && activityEnd.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Kegiatan belum selesai. Administrasi baru bisa diselesaikan setelah kegiatan berakhir." },
      { status: 400 }
    );
  }

  const requiredDocs: string[] =
    reqRow.jenis_kegiatan === "praktikum"
      ? ["doc_pretest", "doc_tes_alat", "doc_praktikum"]
      : ["doc_kegiatan"];

  for (const key of requiredDocs) {
    const list = (reqRow as any)[key] as string[] | null;
    if (!list || list.length === 0) {
      return NextResponse.json(
        { error: "Mohon unggah semua dokumentasi yang diperlukan sebelum menyelesaikan." },
        { status: 400 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = isRevision
    ? {
        // completed tetap false; completed_at tetap (penanda "pernah selesai").
        revisi_diajukan_at: new Date().toISOString(),
        ada_insiden: !!ada_insiden,
      }
    : {
        completed: true,
        completed_at: new Date().toISOString(),
        ada_insiden: !!ada_insiden,
      };

  if (ada_insiden) {
    if (!insiden_jenis || !INSIDEN_VALUES.includes(insiden_jenis)) {
      return NextResponse.json({ error: "Mohon pilih jenis insiden." }, { status: 400 });
    }
    if (insiden_jenis === "lainnya" && !insiden_jenis_lainnya) {
      return NextResponse.json(
        { error: "Mohon jelaskan jenis insiden untuk kategori Lainnya." },
        { status: 400 }
      );
    }
    if (
      !insiden_nama_alat ||
      !insiden_jumlah ||
      !insiden_penyebab ||
      !insiden_pihak_terkait ||
      !insiden_tanggung_jawab
    ) {
      return NextResponse.json({ error: "Mohon lengkapi seluruh detail insiden." }, { status: 400 });
    }
    const insidenDocs = (reqRow as any).insiden_dokumentasi as string[] | null;
    if (!insidenDocs || insidenDocs.length === 0) {
      return NextResponse.json({ error: "Mohon unggah dokumentasi insiden." }, { status: 400 });
    }

    updatePayload.insiden_jenis = insiden_jenis;
    updatePayload.insiden_jenis_lainnya = insiden_jenis === "lainnya" ? insiden_jenis_lainnya : null;
    updatePayload.insiden_nama_alat = insiden_nama_alat;
    updatePayload.insiden_jumlah = insiden_jumlah;
    updatePayload.insiden_penyebab = insiden_penyebab;
    updatePayload.insiden_pihak_terkait = insiden_pihak_terkait;
    updatePayload.insiden_tanggung_jawab = insiden_tanggung_jawab;
  } else {
    updatePayload.insiden_jenis = null;
    updatePayload.insiden_jenis_lainnya = null;
    updatePayload.insiden_nama_alat = null;
    updatePayload.insiden_jumlah = null;
    updatePayload.insiden_penyebab = null;
    updatePayload.insiden_pihak_terkait = null;
    updatePayload.insiden_tanggung_jawab = null;
  }

  // --- Peminjaman alat/bahan ---
  updatePayload.ada_peminjaman = !!ada_peminjaman;

  if (ada_peminjaman) {
    const pinjamAlat = !!pinjam_alat;
    const pinjamBahan = !!pinjam_bahan;

    if (!pinjamAlat && !pinjamBahan) {
      return NextResponse.json(
        { error: "Kalau ada peminjaman, pilih Ya untuk alat dan/atau bahan (minimal salah satu)." },
        { status: 400 }
      );
    }

    let cleanAlat: PinjamItem[] = [];
    let cleanBahan: PinjamItem[] = [];
    try {
      if (pinjamAlat) cleanAlat = await cleanPinjamItems(peminjaman_alat, "alat");
      if (pinjamBahan) cleanBahan = await cleanPinjamItems(peminjaman_bahan, "bahan");
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    updatePayload.pinjam_alat = pinjamAlat;
    updatePayload.pinjam_bahan = pinjamBahan;
    updatePayload.peminjaman_alat = pinjamAlat ? cleanAlat : null;
    updatePayload.peminjaman_bahan = pinjamBahan ? cleanBahan : null;
  } else {
    updatePayload.pinjam_alat = null;
    updatePayload.pinjam_bahan = null;
    updatePayload.peminjaman_alat = null;
    updatePayload.peminjaman_bahan = null;
  }

  // Jalur revisi menulis kolom baru (revisi_diajukan_at) lewat service role
  // setelah kepemilikan & status diverifikasi di atas — supaya tidak
  // bergantung pada policy/trigger kolom untuk pengaju. Pengisian pertama
  // kali tetap lewat sesi pengaju seperti semula.
  const writer = isRevision ? supabaseServer() : supabase;
  const { data, error } = await writer
    .from("practicum_requests")
    .update(updatePayload)
    .eq("id", params.id)
    .eq("completed", false)
    .select()
    .single();

  if (error) {
    console.error("Complete practicum_request error", error);
    return NextResponse.json({ error: "Gagal menyimpan penyelesaian administrasi." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
