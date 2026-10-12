// Sisi server fitur peminjaman: mengumpulkan data (pemohon, Kepala Lab,
// Laboran, tanda tangan) lalu memanggil generator PDF. File ini memakai
// service role & storage privat, jadi JANGAN diimpor dari komponen client.
import { readFile } from "fs/promises";
import path from "path";
import { supabaseServer } from "@/lib/supabase/server";
import { fetchPrivateFileForProxy, isSignatureKey } from "@/lib/storage/b2";
import { BIDANG_ORDER, LAB_TITLE, formatTanggalId, primaryBidang, sortBidang, type LoanRecord } from "@/lib/loans/config";
import { buildLoanPdf, type LoanPdfData, type PdfSigner } from "@/lib/loans/pdf";
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

/** Jabatan (Kepala Lab/Laboran) per bidang yang terlibat, diambil dari tabel lab_roles. */
async function loadLabStaff(bidang: Bidang[]) {
  const { data, error } = await supabaseServer()
    .from("lab_roles")
    .select("role_type, bidang, users!lab_roles_user_id_fkey(id, nama, nip, ttd)")
    .in("role_type", ["kepala_lab", "laboran"])
    .in("bidang", bidang);
  if (error) throw error;

  const rows = (data ?? []) as unknown as { role_type: string; bidang: Bidang; users: UserLite | null }[];
  const kalab = new Map<Bidang, UserLite | null>();
  const laboran: UserLite[] = [];
  for (const b of BIDANG_ORDER) {
    if (!bidang.includes(b)) continue;
    kalab.set(b, rows.find((r) => r.role_type === "kepala_lab" && r.bidang === b)?.users ?? null);
    const lab = rows.find((r) => r.role_type === "laboran" && r.bidang === b)?.users;
    // Orang yang sama memegang dua bidang -> cukup tampil sekali.
    if (lab && !laboran.some((l) => l.id === lab.id)) laboran.push(lab);
  }
  return { kalab, laboran };
}

export async function generateLoanPdf(loan: LoanRecord): Promise<Uint8Array> {
  const db = supabaseServer();
  const bidang = sortBidang(loan.bidang);

  const { data: requesterRow, error: reqErr } = await db
    .from("users")
    .select("id, nama, nim, nip, prodi, fakultas, user_type, ttd")
    .eq("id", loan.requester_id)
    .single();
  if (reqErr || !requesterRow) throw new Error("Data pemohon tidak ditemukan.");
  const requester = requesterRow as UserLite;

  const { kalab, laboran } = await loadLabStaff(bidang);

  const signers: PdfSigner[] = [];

  // Kepala Lab: satu per lab yang alatnya dipinjam (satu atau dua tanda tangan).
  let first = true;
  for (const b of bidang) {
    const u = kalab.get(b) ?? null;
    signers.push({
      preLabel: first ? "Mengetahui," : undefined,
      title: `Kepala Laboratorium Teknik Perminyakan ${LAB_TITLE[b]}`,
      nama: u?.nama ?? null,
      idNumber: u?.nip ?? null,
      idLabel: "NIP.",
      signature: await loadSignature(u),
    });
    first = false;
  }

  // Laboran/Teknisi.
  const laboranList: (UserLite | null)[] = laboran.length > 0 ? laboran : [null];
  for (const u of laboranList) {
    signers.push({
      title: "Teknisi Laboratorium Teknik Perminyakan",
      nama: u?.nama ?? null,
      idNumber: u?.nip ?? null,
      idLabel: "NIP.",
      signature: await loadSignature(u),
    });
  }

  // Pemohon (paling kanan, bersama "Jember, <tanggal>" seperti pada template).
  const isMhs = !!requester.nim;
  signers.push({
    preLabel: `Jember, ${formatTanggalId(new Date(loan.created_at))}`,
    title: "Pemohon",
    nama: requester.nama,
    idNumber: (isMhs ? requester.nim : requester.nip) ?? null,
    idLabel: isMhs ? "NIM." : "NIP.",
    signature: await loadSignature(requester),
  });

  const data: LoanPdfData = {
    requester: {
      nama: requester.nama,
      idNumber: (isMhs ? requester.nim : requester.nip) ?? null,
      idLabel: isMhs ? "NIM" : "NIP",
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
    signers,
  };

  const header = await loadHeader(primaryBidang(loan.items));
  return buildLoanPdf(data, header);
}
