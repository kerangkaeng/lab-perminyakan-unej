import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";

const INSIDEN_VALUES = ["rusak_pecah", "hilang", "tumpah", "lainnya"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();
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

  const updatePayload: Record<string, unknown> = {
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

    function validateItems(items: unknown, label: string) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error(`Mohon tambahkan minimal satu ${label} yang dipinjam.`);
      }
      for (const item of items) {
        if (
          !item ||
          typeof item !== "object" ||
          !("equipment_id" in item) ||
          !item.equipment_id ||
          !("jumlah" in item) ||
          !String(item.jumlah).trim()
        ) {
          throw new Error(`Mohon lengkapi pilihan ${label} dan jumlah/satuannya.`);
        }
      }
    }

    try {
      if (pinjamAlat) validateItems(peminjaman_alat, "alat");
      if (pinjamBahan) validateItems(peminjaman_bahan, "bahan");
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    updatePayload.pinjam_alat = pinjamAlat;
    updatePayload.pinjam_bahan = pinjamBahan;
    updatePayload.peminjaman_alat = pinjamAlat ? peminjaman_alat : null;
    updatePayload.peminjaman_bahan = pinjamBahan ? peminjaman_bahan : null;
  } else {
    updatePayload.pinjam_alat = null;
    updatePayload.pinjam_bahan = null;
    updatePayload.peminjaman_alat = null;
    updatePayload.peminjaman_bahan = null;
  }

  const { data, error } = await supabase
    .from("practicum_requests")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Complete practicum_request error", error);
    return NextResponse.json({ error: "Gagal menyimpan penyelesaian administrasi." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
