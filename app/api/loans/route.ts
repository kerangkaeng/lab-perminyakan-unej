import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { isSignatureKey } from "@/lib/storage/b2";
import {
  DEFAULT_BIDANG_ALAT_UMUM,
  MAX_KEPERLUAN,
  MAX_LOAN_DAYS,
  MAX_LOAN_ITEMS,
  MAX_LOAN_JUMLAH,
  satuanFor,
  sortBidang,
  type LoanItem,
  type LoanJenis,
} from "@/lib/loans/config";
import { BIDANG_VALUES, type Bidang } from "@/lib/lab-roles";

// Pengajuan peminjaman alat/bahan. Semua penulisan lewat service role setelah
// sesi, item, dan tanda tangan pemohon divalidasi di sini — nama alat & lab
// diambil dari database, BUKAN dari kiriman client.

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^[0-9+\-\s()]{8,20}$/;

function isValidDate(s: unknown): s is string {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Tanggal hari ini di WIB (YYYY-MM-DD). */
function todayWib(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

  const keperluan = typeof body.keperluan === "string" ? body.keperluan.trim() : "";
  const kontak = typeof body.kontak === "string" ? body.kontak.trim() : "";
  const tanggalPinjam = body.tanggal_pinjam;
  const tanggalKembali = body.tanggal_kembali;

  if (keperluan.length < 5) return bad("Mohon jelaskan keperluan peminjaman (minimal 5 karakter).");
  if (keperluan.length > MAX_KEPERLUAN) return bad(`Keperluan maksimal ${MAX_KEPERLUAN} karakter.`);
  if (!PHONE_RE.test(kontak)) return bad("Nomor kontak tidak valid (8–20 karakter: angka, +, -, spasi).");
  if (!isValidDate(tanggalPinjam) || !isValidDate(tanggalKembali)) return bad("Tanggal pinjam dan tanggal kembali wajib diisi.");
  if (tanggalPinjam < todayWib()) return bad("Tanggal pinjam tidak boleh sebelum hari ini.");
  if (tanggalKembali < tanggalPinjam) return bad("Tanggal kembali tidak boleh sebelum tanggal pinjam.");
  if (daysBetween(tanggalPinjam, tanggalKembali) > MAX_LOAN_DAYS) {
    return bad(`Lama peminjaman maksimal ${MAX_LOAN_DAYS} hari.`);
  }

  const rawItems: unknown = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) return bad("Mohon pilih minimal satu alat/bahan.");
  if (rawItems.length > MAX_LOAN_ITEMS) return bad(`Maksimal ${MAX_LOAN_ITEMS} item dalam satu peminjaman.`);

  const parsed: { equipment_id: string; jumlah: number; satuan: string }[] = [];
  for (const it of rawItems as Record<string, unknown>[]) {
    const equipmentId = typeof it?.equipment_id === "string" ? it.equipment_id.trim() : "";
    const jumlah = it?.jumlah;
    const satuan = typeof it?.satuan === "string" ? it.satuan.trim() : "";
    if (!equipmentId || typeof jumlah !== "number" || !Number.isFinite(jumlah) || !(jumlah > 0) || jumlah > MAX_LOAN_JUMLAH || !satuan) {
      return bad("Mohon lengkapi setiap baris: alat/bahan, jumlah (angka > 0), dan satuan.");
    }
    parsed.push({ equipment_id: equipmentId, jumlah, satuan });
  }
  const ids = parsed.map((p) => p.equipment_id);
  if (new Set(ids).size !== ids.length) return bad("Ada alat/bahan yang dipilih lebih dari sekali. Gabungkan jumlahnya dalam satu baris.");

  const db = supabaseServer();

  // Pemohon wajib sudah punya tanda tangan (ditempel otomatis ke dokumen).
  const { data: me, error: meErr } = await db.from("users").select("id, ttd").eq("id", session.usersId).single();
  if (meErr || !me) {
    console.error("Cek pemohon peminjaman error (sudah jalankan migrasi 010?)", meErr);
    return NextResponse.json({ error: "Gagal memeriksa data pemohon." }, { status: 500 });
  }
  if (!isSignatureKey(me.ttd as string | null, session.usersId)) {
    return bad("Unggah tanda tangan kamu dulu di halaman Profil sebelum membuat dokumen peminjaman.");
  }

  // Alat/bahan: nama, jenis, dan lab pemilik diambil dari database.
  const { data: eqRows, error: eqErr } = await db
    .from("equipment")
    .select("id, name, jenis, status, facility_id, facilities(bidang)")
    .in("id", ids);
  if (eqErr) {
    console.error("Validasi equipment peminjaman error", eqErr);
    return NextResponse.json({ error: "Gagal memvalidasi alat/bahan. Silakan coba lagi." }, { status: 500 });
  }
  type EqRow = {
    id: string;
    name: string;
    jenis: LoanJenis | null;
    status: string;
    facility_id: string | null;
    facilities: { bidang: Bidang | null } | { bidang: Bidang | null }[] | null;
  };
  const byId = new Map((eqRows as unknown as EqRow[]).map((r) => [r.id, r]));

  const items: LoanItem[] = [];
  for (const p of parsed) {
    const eq = byId.get(p.equipment_id);
    if (!eq || eq.status !== "published" || (eq.jenis !== "alat" && eq.jenis !== "bahan")) {
      return bad("Ada alat/bahan yang tidak ditemukan atau sudah tidak tersedia. Muat ulang halaman lalu pilih lagi.");
    }
    if (!satuanFor(eq.jenis).includes(p.satuan)) return bad(`Satuan "${p.satuan}" tidak valid untuk ${eq.name}.`);
    if (eq.jenis === "alat" && !Number.isInteger(p.jumlah)) return bad(`Jumlah alat "${eq.name}" harus bilangan bulat.`);

    const fac = Array.isArray(eq.facilities) ? eq.facilities[0] : eq.facilities;
    const bidang: Bidang =
      fac?.bidang && (BIDANG_VALUES as readonly string[]).includes(fac.bidang) ? fac.bidang : DEFAULT_BIDANG_ALAT_UMUM;

    items.push({
      equipment_id: eq.id,
      equipment_name: eq.name,
      jenis: eq.jenis,
      jumlah: p.jumlah,
      satuan: p.satuan,
      bidang,
    });
  }

  const bidangList = sortBidang(Array.from(new Set(items.map((i) => i.bidang))));

  const { data: inserted, error: insErr } = await db
    .from("equipment_loans")
    .insert({
      requester_id: session.usersId,
      keperluan,
      kontak,
      tanggal_pinjam: tanggalPinjam,
      tanggal_kembali: tanggalKembali,
      items,
      bidang: bidangList,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    console.error("Simpan equipment_loans error (sudah jalankan migrasi 010?)", insErr);
    return NextResponse.json({ error: "Gagal menyimpan peminjaman." }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id });
}
