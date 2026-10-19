// Konfigurasi & tipe peminjaman alat/bahan. Aman dipakai di server maupun
// client (tidak mengimpor apa pun yang server-only).
import { SATUAN_ALAT, SATUAN_BAHAN } from "@/lib/constants/kegiatan";
import type { Bidang } from "@/lib/lab-roles";

export type LoanJenis = "alat" | "bahan";

export type LoanItem = {
  equipment_id: string;
  equipment_name: string;
  jenis: LoanJenis;
  jumlah: number;
  satuan: string;
  bidang: Bidang;
};

export const MAX_LOAN_ITEMS = 50;
export const MAX_LOAN_JUMLAH = 100000;
export const MAX_KEPERLUAN = 500;
export const MAX_LOAN_DAYS = 365;

/**
 * Alat/bahan "umum" (equipment.facility_id kosong) tidak dimiliki lab
 * tertentu. Untuk menentukan header & Kepala Lab yang menandatangani,
 * alat umum diperlakukan sebagai milik bidang ini.
 * UBAH di sini kalau kebijakannya berbeda.
 */
export const DEFAULT_BIDANG_ALAT_UMUM: Bidang = "reservoir";

/** Urutan tampil/tanda tangan Kepala Lab (sama dengan urutan di template: PP lalu Reservoir). */
export const BIDANG_ORDER: Bidang[] = ["pemboran_produksi", "reservoir"];

export const LAB_TITLE: Record<Bidang, string> = {
  pemboran_produksi: "Pemboran dan Produksi",
  reservoir: "Reservoir",
};

export function satuanFor(jenis: LoanJenis): readonly string[] {
  return jenis === "alat" ? SATUAN_ALAT : SATUAN_BAHAN;
}

export function sortBidang(list: Bidang[]): Bidang[] {
  return BIDANG_ORDER.filter((b) => list.includes(b));
}

/** Bidang yang jadi "tuan rumah" header dokumen: yang itemnya terbanyak; seri -> urutan BIDANG_ORDER paling akhir (Reservoir). */
export function primaryBidang(items: Pick<LoanItem, "bidang">[]): Bidang {
  const count: Record<string, number> = {};
  for (const it of items) count[it.bidang] = (count[it.bidang] ?? 0) + 1;
  const sorted = [...BIDANG_ORDER].sort((a, b) => (count[b] ?? 0) - (count[a] ?? 0));
  const top = count[sorted[0]] ?? 0;
  const tied = sorted.filter((b) => (count[b] ?? 0) === top);
  return tied.includes("reservoir") ? "reservoir" : tied[0];
}

// ---------- Alur peminjaman (status & persetujuan) ----------
//
//  menunggu_upload : form terkirim; pengaju mengunduh template, menandatangani
//                    basah (dospem kiri, pengaju kanan), lalu mengunggah hasil scan/foto.
//  menunggu_acc    : dokumen bertanda tangan sudah diunggah; menunggu ACC
//                    Kepala Lab + Laboran (tiap bidang yang alatnya dipinjam).
//  ditolak         : salah satu penyetujui menolak (ada catatan). Pengaju boleh
//                    mengunggah ulang dokumen -> kembali ke menunggu_acc.
//  disetujui       : semua penyetujui ACC -> surat persetujuan (ttd elektronik) tersedia.
//  legacy          : data dari alur lama (dokumen dibuat sendiri tanpa persetujuan).
export const LOAN_STATUSES = ["menunggu_upload", "menunggu_acc", "ditolak", "disetujui", "legacy"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  menunggu_upload: "Menunggu Upload Dokumen",
  menunggu_acc: "Menunggu Persetujuan",
  ditolak: "Ditolak",
  disetujui: "Disetujui",
  legacy: "Format Lama",
};

/** Batas ukuran scan/foto dokumen bertanda tangan basah (di bawah batas body 4,5 MB platform serverless). */
export const MAX_LOAN_SCAN_BYTES = 4 * 1024 * 1024;
export const MAX_DOSPEM_NAMA = 150;

/** Mahasiswa (punya NIM) wajib mengisi dosen pembimbing; dosen/tendik tidak. */
export function requiresDospem(nim: string | null | undefined): boolean {
  return !!nim;
}

export type ApprovalRole = "kepala_lab" | "laboran";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type LoanApproval = {
  id: string;
  loan_id: string;
  role_type: ApprovalRole;
  bidang: Bidang;
  status: ApprovalStatus;
  approver_id: string | null;
  decided_at: string | null;
  catatan: string | null;
};

/** Mis. "Kepala Lab Reservoir" / "Laboran Pemboran dan Produksi". */
export function approvalTitle(role: ApprovalRole, bidang: Bidang): string {
  return `${role === "kepala_lab" ? "Kepala Lab" : "Laboran"} ${LAB_TITLE[bidang]}`;
}

export type LoanRecord = {
  id: string;
  requester_id: string;
  keperluan: string;
  kontak: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  items: LoanItem[];
  bidang: Bidang[];
  status: LoanStatus;
  created_at: string;
  dospem_nama: string | null;
  dospem_nip: string | null;
  signed_doc_key: string | null;
  signed_doc_mime: string | null;
  signed_uploaded_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  catatan_penolakan: string | null;
};

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-10-20" atau Date -> "20 Oktober 2026" (Date dihitung dalam WIB). */
export function formatTanggalId(d: Date | string): string {
  if (typeof d === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (!m) return d;
    return `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}`;
  }
  // WIB = UTC+7, dihitung manual supaya tidak bergantung ICU/zona server.
  const w = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${w.getUTCDate()} ${BULAN[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}
