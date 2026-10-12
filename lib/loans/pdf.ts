// Generator PDF "Formulir Peminjaman Alat dan Bahan".
//
// Header (kop surat) TIDAK digambar ulang di kode: halaman template
// (lib/loans/templates/header-*.pdf, hasil konversi dari template .docx)
// dipakai apa adanya sebagai latar tiap halaman, jadi formatnya persis sama
// dengan template. Kode ini hanya menggambar isi dokumen dan blok tanda
// tangan di atasnya.
//
// Fungsi ini murni (data masuk -> bytes PDF keluar), tanpa akses database
// atau storage, supaya mudah diuji. Pengambilan data ada di lib/loans/server.ts.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { LoanItem } from "@/lib/loans/config";
import { LAB_TITLE, formatTanggalId } from "@/lib/loans/config";
import type { Bidang } from "@/lib/lab-roles";

export type PdfSigner = {
  /** Baris di atas jabatan, mis. "Mengetahui," atau "Jember, 12 Oktober 2026". Boleh kosong. */
  preLabel?: string;
  /** Jabatan, mis. "Kepala Laboratorium Teknik Perminyakan Reservoir". */
  title: string;
  /** Kosong -> dicetak "(belum ditetapkan)". */
  nama: string | null;
  /** NIP/NIM tanpa awalan. */
  idNumber: string | null;
  /** Awalan nomor identitas: "NIP." atau "NIM.". */
  idLabel: "NIP." | "NIM.";
  /** Gambar tanda tangan (PNG/JPG) atau null kalau belum diunggah. */
  signature: Uint8Array | null;
};

export type LoanPdfData = {
  requester: {
    nama: string;
    idNumber: string | null;
    idLabel: "NIM" | "NIP";
    prodi: string | null;
    fakultas: string | null;
    status: string | null;
    kontak: string;
  };
  keperluan: string;
  tanggalPinjam: string; // YYYY-MM-DD
  tanggalKembali: string; // YYYY-MM-DD
  /** Tanggal dokumen dibuat (untuk "Jember, <tanggal>"). */
  createdAt: Date;
  items: LoanItem[];
  bidang: Bidang[];
  /** Urutan kiri -> kanan. */
  signers: PdfSigner[];
};

// ---------- ukuran halaman & tata letak (pt) ----------
const PAGE_W = 612; // Letter, sama dengan template
const PAGE_H = 792;
const MARGIN_X = 72; // margin kiri/kanan template = 1 inci
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 468
const CONTENT_TOP = PAGE_H - 160; // di bawah garis kop surat (garis kop ~137pt dari atas)
const BOTTOM_MARGIN = 72;
const SIGN_BOTTOM = 80; // dasar blok tanda tangan (mirip posisi tabel di template)

const BODY_SIZE = 11;
const TABLE_SIZE = 10;
const LINE_GAP = 1.25;

function formatJumlah(n: number): string {
  return String(n).replace(".", ",");
}

type Ctx = {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  headerPage: Awaited<ReturnType<PDFDocument["embedPage"]>>;
  page: PDFPage;
  y: number; // posisi menulis saat ini (pt dari bawah)
};

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.page.drawPage(ctx.headerPage, { x: 0, y: 0 });
  ctx.y = CONTENT_TOP;
}

/** Ganti karakter yang tidak ada di font standar (WinAnsi) supaya tidak melempar error. */
function safe(font: PDFFont, text: string): string {
  const clean = text.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  let out = "";
  for (const ch of clean) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = safe(font, text).split(" ").filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  const pushLong = (word: string) => {
    // kata lebih lebar dari kolom: potong per karakter
    let chunk = "";
    for (const ch of word) {
      if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else chunk += ch;
    }
    return chunk;
  };
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      line = trial;
    } else if (!line) {
      line = pushLong(word);
    } else {
      lines.push(line);
      line = font.widthOfTextAtSize(word, size) <= maxWidth ? word : pushLong(word);
    }
  }
  if (line) lines.push(line);
  return lines;
}

function lineHeight(size: number) {
  return size * LINE_GAP;
}

/** Tulis paragraf (rata kiri, wrap otomatis, lanjut ke halaman berikutnya bila perlu). */
function paragraph(ctx: Ctx, text: string, opts: { size?: number; bold?: boolean; x?: number; width?: number; gapAfter?: number } = {}) {
  const size = opts.size ?? BODY_SIZE;
  const font = opts.bold ? ctx.bold : ctx.regular;
  const x = opts.x ?? MARGIN_X;
  const width = opts.width ?? CONTENT_W;
  for (const line of wrap(font, text, size, width)) {
    if (ctx.y - size < BOTTOM_MARGIN) newPage(ctx);
    ctx.y -= size;
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color: rgb(0, 0, 0) });
    ctx.y -= lineHeight(size) - size;
  }
  ctx.y -= opts.gapAfter ?? 0;
}

function sniffImage(bytes: Uint8Array): "png" | "jpg" | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

// ---------- tabel alat/bahan ----------
const COLS = [
  { key: "no", label: "No", w: 28, align: "center" as const },
  { key: "nama", label: "Nama Alat/Bahan", w: 176, align: "left" as const },
  { key: "jenis", label: "Jenis", w: 44, align: "left" as const },
  { key: "lab", label: "Laboratorium", w: 102, align: "left" as const },
  { key: "jumlah", label: "Jumlah", w: 48, align: "right" as const },
  { key: "satuan", label: "Satuan", w: 70, align: "left" as const },
];
const CELL_PAD_X = 4;
const CELL_PAD_Y = 3;

function drawTable(ctx: Ctx, items: LoanItem[]) {
  const size = TABLE_SIZE;
  const lh = lineHeight(size);
  const black = rgb(0, 0, 0);

  const rowCells = (it: LoanItem, i: number) => [
    String(i + 1),
    it.equipment_name,
    it.jenis === "alat" ? "Alat" : "Bahan",
    `Lab. ${LAB_TITLE[it.bidang]}`,
    formatJumlah(it.jumlah),
    it.satuan,
  ];

  const measure = (cells: string[], font: PDFFont) =>
    cells.map((c, idx) => wrap(font, c, size, COLS[idx].w - CELL_PAD_X * 2));

  const drawRow = (cells: string[], font: PDFFont, shade: boolean) => {
    const wrapped = measure(cells, font);
    const maxLines = Math.max(...wrapped.map((w) => w.length));
    const h = maxLines * lh + CELL_PAD_Y * 2;
    if (ctx.y - h < BOTTOM_MARGIN) {
      newPage(ctx);
      drawHeader(); // ulangi baris judul di halaman lanjutan
      return drawRow(cells, font, shade);
    }
    const top = ctx.y;
    let x = MARGIN_X;
    COLS.forEach((col, idx) => {
      if (shade) {
        ctx.page.drawRectangle({ x, y: top - h, width: col.w, height: h, color: rgb(0.9, 0.9, 0.9) });
      }
      ctx.page.drawRectangle({
        x,
        y: top - h,
        width: col.w,
        height: h,
        borderColor: black,
        borderWidth: 0.6,
      });
      wrapped[idx].forEach((line, li) => {
        const tw = font.widthOfTextAtSize(line, size);
        let tx = x + CELL_PAD_X;
        if (col.align === "center") tx = x + (col.w - tw) / 2;
        else if (col.align === "right") tx = x + col.w - CELL_PAD_X - tw;
        ctx.page.drawText(line, {
          x: tx,
          y: top - CELL_PAD_Y - size - li * lh + (lh - size) / 2,
          size,
          font,
          color: black,
        });
      });
      x += col.w;
    });
    ctx.y = top - h;
  };

  function drawHeader() {
    drawRow(COLS.map((c) => c.label), ctx.bold, true);
  }

  drawHeader();
  items.forEach((it, i) => drawRow(rowCells(it, i), ctx.regular, false));
}

// ---------- blok tanda tangan ----------
function layoutSigners(ctx: Ctx, signers: PdfSigner[]) {
  const n = signers.length;
  const colW = CONTENT_W / n;
  const size = n >= 5 ? 8.5 : n === 4 ? 9.5 : 10; // template memakai ukuran kecil; mengecil kalau kolom banyak
  const lh = lineHeight(size);
  const sigH = 54;
  const textW = colW - 10;

  const pre = signers.map((s) => (s.preLabel ? wrap(ctx.regular, s.preLabel, size, textW) : []));
  const titles = signers.map((s) => wrap(ctx.regular, s.title, size, textW));
  const names = signers.map((s) => wrap(ctx.regular, s.nama ?? "(belum ditetapkan)", size, textW));

  const preLines = Math.max(...pre.map((p) => p.length), 0);
  const titleLines = Math.max(...titles.map((t) => t.length));
  const nameLines = Math.max(...names.map((t) => t.length));
  // +1 baris untuk NIP/NIM
  const height = (preLines + titleLines) * lh + 4 + sigH + (nameLines + 1) * lh;
  return { n, colW, size, lh, sigH, textW, pre, titles, names, preLines, titleLines, nameLines, height };
}

async function drawSigners(ctx: Ctx, signers: PdfSigner[]) {
  const L = layoutSigners(ctx, signers);

  // Tanda tangan dipertahankan utuh dalam satu halaman, menempel di dasar halaman terakhir
  // seperti posisi tabel pada template. Kalau isi sudah terlalu rendah, pindah ke halaman baru.
  const topNeeded = SIGN_BOTTOM + L.height;
  if (ctx.y - 12 < topNeeded) newPage(ctx);

  let y = SIGN_BOTTOM + L.height; // titik atas blok
  const black = rgb(0, 0, 0);

  for (let i = 0; i < L.n; i++) {
    const s = signers[i];
    const x = MARGIN_X + i * L.colW;
    let cy = y;

    // baris pra-label (rata atas), lalu jabatan
    const drawLines = (lines: string[], bold = false) => {
      for (const line of lines) {
        cy -= L.size;
        ctx.page.drawText(line, { x, y: cy, size: L.size, font: bold ? ctx.bold : ctx.regular, color: black });
        cy -= L.lh - L.size;
      }
    };
    drawLines(L.pre[i]);
    // rata pra-label antar kolom: kolom dengan pra-label lebih sedikit tetap mulai di baris jabatan yang sama
    cy -= (L.preLines - L.pre[i].length) * L.lh;
    drawLines(L.titles[i]);
    cy -= (L.titleLines - L.titles[i].length) * L.lh;
    cy -= 4;

    // area tanda tangan
    if (s.signature) {
      try {
        const kind = sniffImage(s.signature);
        if (kind) {
          const img = kind === "png" ? await ctx.doc.embedPng(s.signature) : await ctx.doc.embedJpg(s.signature);
          const maxW = L.colW - 16;
          const scale = Math.min(maxW / img.width, (L.sigH - 4) / img.height, 4);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.page.drawImage(img, { x, y: cy - L.sigH + (L.sigH - h) / 2, width: w, height: h });
        }
      } catch (e) {
        console.error("Gagal menyematkan tanda tangan ke PDF", e);
      }
    }
    cy -= L.sigH;

    // nama & NIP/NIM
    drawLines(L.names[i]);
    cy -= (L.nameLines - L.names[i].length) * L.lh;
    if (s.idNumber) {
      const idText = safe(ctx.regular, `${s.idLabel}${s.idNumber}`);
      cy -= L.size;
      ctx.page.drawText(idText, { x, y: cy, size: L.size, font: ctx.regular, color: black });
    }
  }
}

export async function buildLoanPdf(data: LoanPdfData, headerPdf: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Formulir Peminjaman Alat dan Bahan Laboratorium");
  doc.setProducer("Laboratorium Teknik Perminyakan UNEJ");
  doc.setCreator("Laboratorium Teknik Perminyakan UNEJ");

  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const tpl = await PDFDocument.load(headerPdf);
  const headerPage = await doc.embedPage(tpl.getPage(0));

  const ctx: Ctx = { doc, regular, bold, headerPage, page: undefined as unknown as PDFPage, y: CONTENT_TOP };
  newPage(ctx);

  // ---- judul ----
  const title = "FORMULIR PEMINJAMAN ALAT DAN BAHAN LABORATORIUM";
  const titleSize = 12.5;
  const tw = bold.widthOfTextAtSize(title, titleSize);
  ctx.y -= titleSize;
  ctx.page.drawText(title, { x: (PAGE_W - tw) / 2, y: ctx.y, size: titleSize, font: bold, color: rgb(0, 0, 0) });
  ctx.page.drawLine({
    start: { x: (PAGE_W - tw) / 2, y: ctx.y - 2 },
    end: { x: (PAGE_W + tw) / 2, y: ctx.y - 2 },
    thickness: 0.8,
    color: rgb(0, 0, 0),
  });
  ctx.y -= 22;

  // ---- identitas pemohon ----
  paragraph(ctx, "Yang bertanda tangan di bawah ini:", { gapAfter: 4 });
  const r = data.requester;
  const idRows: [string, string][] = [
    ["Nama", r.nama],
    [r.idLabel, r.idNumber ?? "-"],
    ["Program Studi/Unit Kerja", r.prodi ?? "-"],
  ];
  if (r.fakultas) idRows.push(["Fakultas", r.fakultas]);
  if (r.status) idRows.push(["Status", r.status.charAt(0).toUpperCase() + r.status.slice(1)]);
  idRows.push(["Nomor Kontak", r.kontak]);

  const LABEL_W = 138;
  const INDENT = 18;
  for (const [label, value] of idRows) {
    const valueLines = wrap(regular, value, BODY_SIZE, CONTENT_W - INDENT - LABEL_W - 10);
    valueLines.forEach((line, i) => {
      if (ctx.y - BODY_SIZE < BOTTOM_MARGIN) newPage(ctx);
      ctx.y -= BODY_SIZE;
      if (i === 0) {
        ctx.page.drawText(safe(regular, label), { x: MARGIN_X + INDENT, y: ctx.y, size: BODY_SIZE, font: regular });
        ctx.page.drawText(":", { x: MARGIN_X + INDENT + LABEL_W, y: ctx.y, size: BODY_SIZE, font: regular });
      }
      ctx.page.drawText(line, { x: MARGIN_X + INDENT + LABEL_W + 10, y: ctx.y, size: BODY_SIZE, font: regular });
      ctx.y -= lineHeight(BODY_SIZE) - BODY_SIZE;
    });
  }
  ctx.y -= 8;

  // ---- narasi permohonan ----
  const labs = data.bidang.map((b) => `Laboratorium ${LAB_TITLE[b]}`).join(" dan ");
  const sameDay = data.tanggalPinjam === data.tanggalKembali;
  const periode = sameDay
    ? `pada tanggal ${formatTanggalId(data.tanggalPinjam)}`
    : `mulai tanggal ${formatTanggalId(data.tanggalPinjam)} sampai dengan ${formatTanggalId(data.tanggalKembali)}`;
  paragraph(
    ctx,
    `Dengan ini mengajukan permohonan peminjaman alat dan/atau bahan di ${labs}, Program Studi Teknik Perminyakan, ` +
      `Fakultas Teknik Universitas Jember, untuk keperluan ${data.keperluan.trim().replace(/[.\s]+$/, "")}. ` +
      `Peminjaman direncanakan ${periode}, dengan rincian sebagai berikut:`,
    { gapAfter: 8 }
  );

  // ---- tabel ----
  drawTable(ctx, data.items);
  ctx.y -= 12;

  // ---- penutup ----
  const closing =
    "Demikian permohonan ini kami sampaikan. Peminjam bersedia menggunakan alat dan bahan sesuai prosedur " +
    "(SOP) laboratorium, menjaga kebersihan dan keutuhannya, serta mengembalikannya tepat waktu dalam kondisi baik. " +
    "Apabila terjadi kerusakan atau kehilangan, peminjam bersedia bertanggung jawab sesuai ketentuan yang berlaku di laboratorium.";
  // Paragraf penutup selalu satu halaman dengan tanda tangan: kalau keduanya tidak muat
  // di sisa halaman, pindah bersama-sama (tidak ada halaman yang isinya cuma tanda tangan).
  const closingH = wrap(regular, closing, BODY_SIZE, CONTENT_W).length * lineHeight(BODY_SIZE);
  const signH = layoutSigners(ctx, data.signers).height;
  if (ctx.y - closingH - 16 < SIGN_BOTTOM + signH) newPage(ctx);
  paragraph(ctx, closing);

  // ---- tanda tangan ----
  await drawSigners(ctx, data.signers);

  return await doc.save();
}
