// Sisi server fitur peminjaman: mengumpulkan data (pemohon, Kepala Lab,
// Laboran, tanda tangan) lalu memanggil generator PDF. File ini memakai
// service role & storage privat, jadi JANGAN diimpor dari komponen client.
import { readFile } from "fs/promises";
import path from "path";
import { supabaseServer } from "@/lib/supabase/server";
import { fetchPrivateFileForProxy, isSignatureKey } from "@/lib/storage/b2";
import {
  BIDANG_ORDER,
  LAB_TITLE,
  formatTanggalId,
  primaryBidang,
  sortBidang,
  type LoanApproval,
  type LoanRecord,
} from "@/lib/loans/config";
import { buildLoanPdf, type PdfSigner } from "@/lib/loans/pdf";
import type { Bidang } from "@/lib/lab-roles";

const HEADER_FILE: Record<Bidang, string> = {
  reservoir: "header-reservoir.pdf",
  pemboran_produksi: "header-pemboran-produksi.pdf",
};

type UserLite = {
  id: string;
  nama: string;
  nim?: string | null;
  nip: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  user_type?: string | null;
  ttd: string | null;
};

async function loadSignature(user: UserLite | null): Promise<Uint8Array | null> {
  if (!user || !isSignatureKey(user.ttd, user.id)) return null;
  const file = await fetchPrivateFileForProxy(user.ttd);
  return file ? file.body : null;
}

async function loadHeader(bidang: Bidang): Promise<Uint8Array> {
  const file = path.join(process.cwd(), "lib", "loans", "templates", HEADER_FILE[bidang]);
  return new Uint8Array(await readFile(file));
}

type RequesterRow = UserLite;

async function loadRequester(loan: LoanRecord): Promise<RequesterRow> {
  const { data, error } = await supabaseServer()
    .from("users")
    .select("id, nama, nim, nip, prodi, fakultas, user_type, ttd")
    .eq("id", loan.requester_id)
    .single();
  if (error || !data) throw new Error("Data pemohon tidak ditemukan.");
  return data as RequesterRow;
}

function baseData(loan: LoanRecord, requester: RequesterRow, bidang: Bidang[]) {
  const isMhs = !!requester.nim;
  return {
    dospem: loan.dospem_nama ? { nama: loan.dospem_nama, nip: loan.dospem_nip } : null,
    requester: {
      nama: requester.nama,
      idNumber: (isMhs ? requester.nim : requester.nip) ?? null,
      idLabel: (isMhs ? "NIM" : "NIP") as "NIM" | "NIP",
      prodi: requester.prodi ?? null,
      fakultas: requester.fakultas ?? null,
      status: requester.user_type ?? null,
      kontak: loan.kontak,
    },
    keperluan: loan.keperluan,
    tanggalPinjam: loan.tanggal_pinjam,
    tanggalKembali: loan.tanggal_kembali,
    createdAt: new Date(loan.created_at),
    items: loan.items,
    bidang,
  };
}

/**
 * TEMPLATE yang diunduh pengaju: data peminjaman terisi, blok tanda tangan
 * KOSONG untuk ttd basah — Dosen Pembimbing (kiri) dan Pemohon (kanan).
 * Tidak ada tanda tangan elektronik di sini.
 */
export async function generateLoanTemplatePdf(loan: LoanRecord): Promise<Uint8Array> {
  const bidang = sortBidang(loan.bidang);
  const requester = await loadRequester(loan);
  const isMhs = !!requester.nim;

  const signers: PdfSigner[] = [
    loan.dospem_nama
      ? {
          title: "Dosen Pembimbing",
          nama: loan.dospem_nama,
          idNumber: loan.dospem_nip,
          idLabel: "NIP.",
          signature: null,
        }
      : // Dosen/tendik tidak punya dospem: kolom kiri dikosongkan supaya Pemohon tetap di kanan.
        { title: "", nama: "", idNumber: null, idLabel: "NIP.", signature: null },
    {
      preLabel: `Jember, ${formatTanggalId(new Date(loan.created_at))}`,
      title: "Pemohon",
      nama: requester.nama,
      idNumber: (isMhs ? requester.nim : requester.nip) ?? null,
      idLabel: isMhs ? "NIM." : "NIP.",
      signature: null,
    },
  ];

  const header = await loadHeader(primaryBidang(loan.items));
  return buildLoanPdf({ ...baseData(loan, requester, bidang), mode: "form", signers }, header);
}

/**
 * SURAT PERSETUJUAN (setelah semua ACC): memuat tanda tangan elektronik
 * Kepala Lab dan Laboran yang BENAR-BENAR menyetujui (diambil dari catatan
 * persetujuan, bukan dari pemegang jabatan saat ini) supaya surat yang sama
 * tetap sah walau jabatan berganti di kemudian hari.
 */
export async function generateLoanApprovalPdf(loan: LoanRecord): Promise<Uint8Array> {
  const db = supabaseServer();
  const bidang = sortBidang(loan.bidang);
  const requester = await loadRequester(loan);

  const { data, error } = await db
    .from("equipment_loan_approvals")
    .select("role_type, bidang, status, decided_at, approver:users!approver_id(id, nama, nip, ttd)")
    .eq("loan_id", loan.id)
    .eq("status", "approved");
  if (error) throw error;

  type Row = {
    role_type: LoanApproval["role_type"];
    bidang: Bidang;
    decided_at: string | null;
    approver: UserLite | UserLite[] | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    approver: Array.isArray(r.approver) ? (r.approver[0] ?? null) : r.approver,
  }));

  const signers: PdfSigner[] = [];

  let first = true;
  for (const b of bidang) {
    const u = rows.find((r) => r.role_type === "kepala_lab" && r.bidang === b)?.approver ?? null;
    signers.push({
      preLabel: first ? "Menyetujui," : undefined,
      title: `Kepala Laboratorium Teknik Perminyakan ${LAB_TITLE[b]}`,
      nama: u?.nama ?? null,
      idNumber: u?.nip ?? null,
      idLabel: "NIP.",
      signature: await loadSignature(u),
    });
    first = false;
  }

  // Laboran: orang yang sama di dua bidang cukup tampil sekali.
  const laborans: UserLite[] = [];
  for (const b of BIDANG_ORDER) {
    if (!bidang.includes(b)) continue;
    const u = rows.find((r) => r.role_type === "laboran" && r.bidang === b)?.approver ?? null;
    if (u && !laborans.some((l) => l.id === u.id)) laborans.push(u);
  }
  const approvedAt = rows
    .map((r) => (r.decided_at ? new Date(r.decided_at) : null))
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? (loan.approved_at ? new Date(loan.approved_at) : null);

  const laboranList: (UserLite | null)[] = laborans.length > 0 ? laborans : [null];
  for (let i = 0; i < laboranList.length; i++) {
    const u = laboranList[i];
    signers.push({
      preLabel: i === 0 ? `Jember, ${formatTanggalId(approvedAt ?? new Date())}` : undefined,
      title: "Teknisi Laboratorium Teknik Perminyakan",
      nama: u?.nama ?? null,
      idNumber: u?.nip ?? null,
      idLabel: "NIP.",
      signature: await loadSignature(u),
    });
  }

  const header = await loadHeader(primaryBidang(loan.items));
  return buildLoanPdf({ ...baseData(loan, requester, bidang), mode: "approval", approvedAt, signers }, header);
}
