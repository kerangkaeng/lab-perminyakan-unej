// Sisi server fitur peminjaman: mengumpulkan data (pemohon, Kepala Lab,
// Laboran, tanda tangan) lalu memanggil generator PDF. File ini memakai
// service role & storage privat, jadi JANGAN diimpor dari komponen client.
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { supabaseServer } from "@/lib/supabase/server";
import { fetchPrivateFileForProxy, isSignatureKey } from "@/lib/storage/b2";
import {
  LAB_TITLE,
  formatTanggalId,
  primaryBidang,
  sortBidang,
  type LoanApproval,
  type LoanRecord,
} from "@/lib/loans/config";
import { buildLoanPdf, type PdfSigner } from "@/lib/loans/pdf";
import type { Bidang } from "@/lib/lab-roles";

const LOGO_FILE = "logo-unej.png";

type UserLite = {
  id: string;
  nama: string;
  nim?: string | null;
  nip: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  user_type?: string | null;
  nama_gelar?: string | null;
  ttd: string | null;
};

async function loadSignature(user: UserLite | null): Promise<Uint8Array | null> {
  if (!user || !isSignatureKey(user.ttd, user.id)) return null;
  const file = await fetchPrivateFileForProxy(user.ttd);
  return file ? file.body : null;
}

async function loadLogo(): Promise<Uint8Array> {
  const file = path.join(process.cwd(), "lib", "loans", "templates", LOGO_FILE);
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
    headerBidang: primaryBidang(loan.items),
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
          preLabel: "Mengetahui,",
          title: "Dosen Pembimbing Penelitian",
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

  const logoPng = await loadLogo();
  return buildLoanPdf({ ...baseData(loan, requester, bidang), mode: "form", signers }, logoPng);
}

/**
 * SURAT PERSETUJUAN (setelah semua ACC): surat izin dari Kepala Lab kepada Teknisi/Asisten
 * Laboratorium, hanya ditandatangani Kepala Lab (tanda tangan elektronik) yang BENAR-BENAR
 * menyetujui (diambil dari catatan persetujuan, bukan dari pemegang jabatan saat ini) supaya
 * surat yang sama tetap sah walau jabatan berganti di kemudian hari.
 *
 * Satu surat PER LABORATORIUM: hanya memuat alat milik lab itu, kop dan tanda tangan lab itu.
 * Peminjaman lintas lab menghasilkan dua surat (formulir pengajuan tetap satu daftar).
 *   - `bidang` diisi  -> satu surat untuk lab tersebut.
 *   - `bidang` kosong -> lab tunggal: satu surat; dua lab: kedua surat digabung (satu file, dua bagian).
 */
export async function generateLoanApprovalPdf(loan: LoanRecord, bidang?: Bidang): Promise<Uint8Array> {
  const labs = sortBidang(loan.bidang);
  if (bidang) return generateApprovalLetter(loan, bidang);
  if (labs.length === 1) return generateApprovalLetter(loan, labs[0]);

  const merged = await PDFDocument.create();
  for (const b of labs) {
    const part = await PDFDocument.load(await generateApprovalLetter(loan, b));
    const pages = await merged.copyPages(part, part.getPageIndices());
    pages.forEach((pg) => merged.addPage(pg));
  }
  return await merged.save();
}

async function generateApprovalLetter(loan: LoanRecord, b: Bidang): Promise<Uint8Array> {
  const db = supabaseServer();
  const requester = await loadRequester(loan);

  const selectApprovals = (cols: string) =>
    db
      .from("equipment_loan_approvals")
      .select(`role_type, bidang, status, decided_at, approver:users!approver_id(${cols})`)
      .eq("loan_id", loan.id)
      .eq("status", "approved");
  let { data, error } = await selectApprovals("id, nama, nama_gelar, nip, ttd");
  // Kolom nama_gelar belum ada (migrasi 012 belum dijalankan): pakai nama dari SSO.
  if (error?.code === "42703") ({ data, error } = await selectApprovals("id, nama, nip, ttd"));
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

  const u = rows.find((r) => r.role_type === "kepala_lab" && r.bidang === b)?.approver ?? null;
  const signers: PdfSigner[] = [
    {
      preLabel: "Jember,",
      title: `Kepala Laboratorium ${LAB_TITLE[b]}`,
      nama: u?.nama_gelar?.trim() || u?.nama || null,
      idNumber: u?.nip ?? null,
      idLabel: "NIP.",
      signature: await loadSignature(u),
    },
  ];

  // Tanggal surat = keputusan Kepala Lab lab ini; cadangan: persetujuan terakhir / waktu approved_at.
  const decided = (r: Row) => (r.decided_at ? new Date(r.decided_at) : null);
  const approvedAt =
    rows.filter((r) => r.role_type === "kepala_lab" && r.bidang === b).map(decided).find((d) => !!d) ??
    rows.map(decided).filter((d): d is Date => !!d).sort((x, y) => y.getTime() - x.getTime())[0] ??
    (loan.approved_at ? new Date(loan.approved_at) : null);

  // Hanya alat milik lab ini (alat tanpa bidang jelas mengikuti bidang utama peminjaman).
  const items = loan.items.filter((it) => it.bidang === b);
  const logoPng = await loadLogo();
  return buildLoanPdf(
    {
      ...baseData(loan, requester, [b]),
      headerBidang: b,
      items: items.length > 0 ? items : loan.items,
      mode: "approval",
      approvedAt,
      signers,
    },
    logoPng
  );
}
