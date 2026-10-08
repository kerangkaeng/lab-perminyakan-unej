import ExcelJS from "exceljs";
import { PracticumRequest } from "@/types";
import { nonPraktikumLabel, insidenLabel } from "@/lib/constants/kegiatan";
import { rawStatusLabel, adminStatusLabel } from "@/lib/admin/requestFilters";

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: "Tanggal Kegiatan", key: "tanggal", width: 16 },
  { header: "Jam", key: "jam", width: 14 },
  { header: "Laboratorium", key: "lokasi", width: 24 },
  { header: "Nama Pengaju", key: "nama", width: 24 },
  { header: "NIM/NIP", key: "nim", width: 16 },
  { header: "Prodi", key: "prodi", width: 20 },
  { header: "Jenis Kegiatan", key: "jenis", width: 16 },
  { header: "Nama Kegiatan/Modul", key: "namaKegiatan", width: 30 },
  { header: "Status Pengajuan", key: "statusPengajuan", width: 16 },
  { header: "Catatan Admin", key: "catatanAdmin", width: 28 },
  { header: "Status Administrasi", key: "statusAdministrasi", width: 26 },
  { header: "Ada Insiden?", key: "adaInsiden", width: 14 },
  { header: "Jenis Insiden", key: "jenisInsiden", width: 18 },
];

/**
 * Bikin workbook Excel satu-sheet dari daftar pengajuan yang SUDAH difilter
 * & diurutkan (lihat lib/admin/requestFilters.ts) — fungsi ini murni soal
 * layout/format, tidak melakukan filtering apa pun sendiri.
 *
 * Layout: baris 1 = judul (merged), baris 2 = header kolom, baris 3+ = data.
 * Header kolom ditulis MANUAL (bukan lewat opsi `header` pada sheet.columns)
 * supaya tidak bentrok dengan sel judul yang di-merge di baris 1 — kalau
 * sheet.columns menulis header otomatis ke baris 1 sementara baris 1 sudah
 * di-merge untuk judul, hasilnya akan rusak/error.
 */
export async function buildRecapWorkbook(
  requests: PracticumRequest[],
  opts: { title: string }
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lab Perminyakan UNEJ";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Rekap", {
    views: [{ state: "frozen", ySplit: 2 }], // baris judul & header tetap terlihat saat scroll
  });

  // Set lebar & key kolom dulu (TANPA opsi `header`, supaya ExcelJS tidak
  // otomatis menulis apa pun ke baris 1).
  sheet.columns = COLUMNS.map(({ key, width }) => ({ key, width }));

  // Baris 1: judul, merged selebar semua kolom.
  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = opts.title;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 24;

  // Baris 2: header kolom, ditulis manual.
  const headerRow = sheet.getRow(2);
  COLUMNS.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col.header;
  });
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F4C5C" } }; // warna petrol
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 20;
  headerRow.commit();

  // Baris 3+: data. addRow dengan object otomatis menambah di baris
  // berikutnya yang kosong (di sini: mulai baris 3).
  for (const r of requests) {
    const namaKegiatan =
      r.jenis_kegiatan === "praktikum"
        ? [r.praktikum_nama, r.modul].filter(Boolean).join(" — ")
        : r.kegiatan_non_praktikum === "lainnya"
        ? r.deskripsi_lainnya || "Lainnya"
        : nonPraktikumLabel(r.kegiatan_non_praktikum);

    sheet.addRow({
      tanggal: r.tanggal,
      jam: `${r.jam_mulai}–${r.jam_selesai}`,
      lokasi: r.lokasi ?? "-",
      nama: r.requester?.nama ?? "-",
      nim: r.requester?.nim ?? "-",
      prodi: r.requester?.prodi ?? "-",
      jenis: r.jenis_kegiatan === "praktikum" ? "Praktikum" : "Non-Praktikum",
      namaKegiatan,
      statusPengajuan: rawStatusLabel(r.status),
      catatanAdmin: r.catatan_admin ?? "",
      statusAdministrasi: adminStatusLabel(r),
      adaInsiden: r.ada_insiden ? "Ya" : "Tidak",
      jenisInsiden: r.ada_insiden
        ? r.insiden_jenis === "lainnya"
          ? r.insiden_jenis_lainnya || "Lainnya"
          : insidenLabel(r.insiden_jenis)
        : "",
    });
  }

  // Border tipis + zebra striping ringan supaya enak dibaca untuk baris banyak.
  const lastRow = sheet.rowCount;
  for (let i = 3; i <= lastRow; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
      };
    });
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F5" } };
      });
    }
  }

  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: COLUMNS.length } };

  if (requests.length === 0) {
    sheet.mergeCells(3, 1, 3, COLUMNS.length);
    const emptyCell = sheet.getCell(3, 1);
    emptyCell.value = "Tidak ada data yang cocok dengan rentang/filter ini.";
    emptyCell.font = { italic: true, color: { argb: "FF888888" } };
  }

  return workbook;
}
