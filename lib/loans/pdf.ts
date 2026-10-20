// Generator PDF peminjaman alat/bahan. Dua jenis dokumen (LoanPdfData.mode):
//   - "form"     : template formulir yang diunduh pengaju. Blok tanda tangan
//                  KOSONG (ttd basah): Dosen Pembimbing di kiri, Pemohon di kanan.
//   - "approval" : surat persetujuan setelah ACC; memuat tanda tangan
//                  elektronik Kepala Lab dan Laboran.
//
// Header (kop surat) DIGAMBAR LANGSUNG DI SINI (bukan dari halaman PDF statis
// lagi) memakai logo asli UNEJ (lib/loans/templates/logo-unej.png). Sebelumnya
// kop diambil dari lib/loans/templates/header-*.pdf (hasil konversi .docx),
// tapi baris nama lab yang panjang ("LABORATORIUM PEMBORAN DAN PRODUKSI")
// tidak ke-tengah dengan benar di file statis itu (lebar teksnya tidak dihitung
// ulang), jadi kelihatan berantakan/nabrak logo. Dengan digambar ulang di sini,
// centering selalu dihitung dari lebar teks asli, untuk nama lab apa pun.
//
// Fungsi ini murni (data masuk -> bytes PDF keluar), tanpa akses database
// atau storage, supaya mudah diuji. Pengambilan data ada di lib/loans/server.ts.
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { LoanItem } from "@/lib/loans/config";
import { LAB_TITLE, formatTanggalId } from "@/lib/loans/config";
import type { Bidang } from "@/lib/lab-roles";

export type PdfSigner = {
  /** Baris di atas jabatan, mis. "Mengetahui," atau "Jember, 12 Oktober 2026". Boleh kosong. */
  preLabel?: string;
  /** Jabatan, mis. "Kepala Laboratorium Reservoir". */
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
  /** "form" = template ttd basah; "approval" = surat persetujuan ber-ttd elektronik. */
  mode: "form" | "approval";
  /** Bidang "tuan rumah" kop surat (dipakai untuk baris "LABORATORIUM ..."). */
  headerBidang: Bidang;
  /** Dosen pembimbing (mahasiswa saja); null untuk dosen/tendik. */
  dospem: { nama: string; nip: string | null } | null;
  /** Tanggal ACC terakhir (hanya mode "approval"). */
  approvedAt?: Date | null;
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
const PAGE_W = 612; // Letter
const PAGE_H = 792;
const MARGIN_X = 72; // margin kiri/kanan = 1 inci
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 468
const BOTTOM_MARGIN = 72;
const SIGN_BOTTOM = 80; // dasar blok tanda tangan

const BODY_SIZE = 11;
const TABLE_SIZE = 10;
const LINE_GAP = 1.25;

// ---------- kop surat ----------
const KOP_TOP_PAD = 24; // jarak dari tepi atas halaman ke logo
const LOGO_SIZE = 60; // logo persegi (sumber 223x220px, hampir persegi)
const KOP_GAP = 16; // jarak logo <-> blok teks
const KOP_LINE1_SIZE = 11.5; // "KEMENTERIAN ..."
const KOP_LINE2_SIZE = 13; // "UNIVERSITAS JEMBER" / "FAKULTAS TEKNIK" / "LABORATORIUM ..."
const KOP_ADDR_SIZE = 9.5;
const KOP_LINE_GAP = 1.3;

function formatJumlah(n: number): string {
  return String(n).replace(".", ",");
}

type Ctx = {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  logo: PDFImage;
  headerBidang: Bidang;
  page: PDFPage;
  y: number; // posisi menulis saat ini (pt dari bawah)
  contentTop: number; // y awal konten tiap halaman, di bawah kop
};

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

function wrapWords(font: PDFFont, text: string, size: number, maxWidth: number): string[][] {
  const words = safe(font, text).split(" ").filter(Boolean);
  if (words.length === 0) return [[]];
  const lines: string[][] = [];
  let line: string[] = [];
  for (const word of words) {
    const trial = line.length ? `${line.join(" ")} ${word}` : word;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth || line.length === 0) {
      line.push(word);
    } else {
      lines.push(line);
      line = [word];
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  return wrapWords(font, text, size, maxWidth).map((words) => words.join(" "));
}

function lineHeight(size: number, gap: number = LINE_GAP) {
  return size * gap;
}

/** Satu baris kop, di-tengah-kan terhadap [x, x+width] — selalu dihitung ulang dari lebar teks asli. */
function drawCenteredLine(ctx: Ctx, text: string, y: number, opts: { size: number; bold?: boolean; x: number; width: number }) {
  const font = opts.bold ? ctx.bold : ctx.regular;
  const clean = safe(font, text);
  const tw = font.widthOfTextAtSize(clean, opts.size);
  const tx = opts.x + Math.max(0, (opts.width - tw) / 2);
  ctx.page.drawText(clean, { x: tx, y, size: opts.size, font, color: rgb(0, 0, 0) });
}

/** Gambar kop surat (logo + identitas institusi + garis ganda) di halaman aktif. Mengembalikan y setelah kop. */
function drawKop(ctx: Ctx): number {
  const black = rgb(0, 0, 0);
  const logoX = MARGIN_X;
  const logoTopY = PAGE_H - KOP_TOP_PAD;
  const logoBottomY = logoTopY - LOGO_SIZE;
  ctx.page.drawImage(ctx.logo, { x: logoX, y: logoBottomY, width: LOGO_SIZE, height: LOGO_SIZE });

  const textX = logoX + LOGO_SIZE + KOP_GAP;
  const textW = PAGE_W - MARGIN_X - textX;

  let y = logoTopY;
  const l1 = wrap(ctx.bold, "KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI", KOP_LINE1_SIZE, textW);
  for (const line of l1) {
    y -= KOP_LINE1_SIZE;
    drawCenteredLine(ctx, line, y, { size: KOP_LINE1_SIZE, bold: true, x: textX, width: textW });
    y -= lineHeight(KOP_LINE1_SIZE, KOP_LINE_GAP) - KOP_LINE1_SIZE;
  }
  y -= 1;

  const headings = ["UNIVERSITAS JEMBER", "FAKULTAS TEKNIK", `LABORATORIUM ${LAB_TITLE[ctx.headerBidang].toUpperCase()}`];
  for (const heading of headings) {
    for (const line of wrap(ctx.bold, heading, KOP_LINE2_SIZE, textW)) {
      y -= KOP_LINE2_SIZE;
      drawCenteredLine(ctx, line, y, { size: KOP_LINE2_SIZE, bold: true, x: textX, width: textW });
      y -= lineHeight(KOP_LINE2_SIZE, KOP_LINE_GAP) - KOP_LINE2_SIZE;
    }
  }

  // Alamat: di bawah blok teks (atau di bawah logo kalau blok teksnya pendek), rata tengah ke seluruh lebar konten.
  const addrY = Math.min(y, logoBottomY) - 6;
  let yy = addrY;
  const addrLines = wrap(
    ctx.regular,
    "Jalan Kalimantan 37 Kampus Bumi Tegal Boto Kotak Pos 159 Jember 68121 • Telepon (0331) 484977 Faksimile (0331) 484977 • Laman: teknik.unej.ac.id",
    KOP_ADDR_SIZE,
    CONTENT_W
  );
  for (const line of addrLines) {
    yy -= KOP_ADDR_SIZE;
    drawCenteredLine(ctx, line, yy, { size: KOP_ADDR_SIZE, x: MARGIN_X, width: CONTENT_W });
    yy -= lineHeight(KOP_ADDR_SIZE, KOP_LINE_GAP) - KOP_ADDR_SIZE;
  }

  // Garis ganda khas surat resmi instansi pemerintah: garis tebal lalu garis tipis.
  const ruleY = yy - 5;
  ctx.page.drawLine({ start: { x: MARGIN_X, y: ruleY }, end: { x: PAGE_W - MARGIN_X, y: ruleY }, thickness: 1.6, color: black });
  ctx.page.drawLine({ start: { x: MARGIN_X, y: ruleY - 3 }, end: { x: PAGE_W - MARGIN_X, y: ruleY - 3 }, thickness: 0.7, color: black });

  return ruleY - 3 - 20; // jarak ke konten pertama
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.contentTop = drawKop(ctx);
  ctx.y = ctx.contentTop;
}

/** Tulis paragraf rata kiri (dipakai untuk baris pendek / label — bukan narasi panjang). */
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

/**
 * Tulis paragraf narasi rata kiri-kanan (justify): spasi antar kata di tiap
 * baris (kecuali baris terakhir paragraf) direnggangkan supaya tepi kanan
 * rata, seperti pada surat resmi cetak.
 */
function paragraphJustify(ctx: Ctx, text: string, opts: { size?: number; x?: number; width?: number; gapAfter?: number } = {}) {
  const size = opts.size ?? BODY_SIZE;
  const font = ctx.regular;
  const x = opts.x ?? MARGIN_X;
  const width = opts.width ?? CONTENT_W;
  const black = rgb(0, 0, 0);
  const lines = wrapWords(font, text, size, width);
  const spaceWidth = font.widthOfTextAtSize(" ", size);

  lines.forEach((words, idx) => {
    if (ctx.y - size < BOTTOM_MARGIN) newPage(ctx);
    ctx.y -= size;
    const isLastLine = idx === lines.length - 1;
    if (isLastLine || words.length <= 1) {
      ctx.page.drawText(words.join(" "), { x, y: ctx.y, size, font, color: black });
    } else {
      const wordsWidth = words.reduce((sum, w) => sum + font.widthOfTextAtSize(w, size), 0);
      const gaps = words.length - 1;
      const extra = Math.max(0, width - wordsWidth - spaceWidth * gaps);
      const gapWidth = spaceWidth + extra / gaps;
      let cx = x;
      words.forEach((w) => {
        ctx.page.drawText(w, { x: cx, y: ctx.y, size, font, color: black });
        cx += font.widthOfTextAtSize(w, size) + gapWidth;
      });
    }
    ctx.y -= lineHeight(size) - size;
  });
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
    let x = MARGIN_X + i * L.colW;
    // Kolom paling kanan digeser ke kanan: tepi kanan teks terpanjang rata dengan margin kanan
    // (seperti surat contoh), bukan menempel di awal kolomnya.
    if (i === L.n - 1) {
      const idW = s.idNumber ? ctx.regular.widthOfTextAtSize(safe(ctx.regular, `${s.idLabel}${s.idNumber}`), L.size) : 0;
      const blockW = Math.max(
        idW,
        ...[...L.pre[i], ...L.titles[i], ...L.names[i]].map((t) => ctx.regular.widthOfTextAtSize(t, L.size))
      );
      x = Math.max(x, PAGE_W - MARGIN_X - blockW);
    }
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
          const maxW = Math.min(L.colW - 16, PAGE_W - MARGIN_X - x);
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

export async function buildLoanPdf(data: LoanPdfData, logoPng: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(
    data.mode === "approval"
      ? "Surat Persetujuan Peminjaman Alat dan Bahan Laboratorium"
      : "Formulir Peminjaman Alat dan Bahan Laboratorium"
  );
  doc.setProducer("Laboratorium Teknik Perminyakan UNEJ");
  doc.setCreator("Laboratorium Teknik Perminyakan UNEJ");

  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const logo = await doc.embedPng(logoPng);

  const ctx: Ctx = {
    doc,
    regular,
    bold,
    logo,
    headerBidang: data.headerBidang,
    page: undefined as unknown as PDFPage,
    y: 0,
    contentTop: 0,
  };
  newPage(ctx);

  // ---- Lampiran & Hal (tanpa Nomor untuk sementara — belum ada sistem penomoran surat) ----
  const hal =
    data.mode === "approval"
      ? "Persetujuan Peminjaman Alat dan Bahan Laboratorium"
      : "Permohonan Peminjaman Alat dan Bahan Laboratorium";
  const dateLabel = `Jember, ${formatTanggalId(data.mode === "approval" ? (data.approvedAt ?? data.createdAt) : data.createdAt)}`;
  const dateW = regular.widthOfTextAtSize(safe(regular, dateLabel), BODY_SIZE);
  ctx.page.drawText(safe(regular, dateLabel), {
    x: PAGE_W - MARGIN_X - dateW,
    y: ctx.y,
    size: BODY_SIZE,
    font: regular,
    color: rgb(0, 0, 0),
  });
  const META_LABEL_W = 62;
  const metaRows: [string, string][] = [
    ["Lampiran", "-"],
    ["Hal", hal],
  ];
  for (const [label, value] of metaRows) {
    const valueLines = wrap(regular, value, BODY_SIZE, CONTENT_W - META_LABEL_W - 300);
    valueLines.forEach((line, i) => {
      if (ctx.y - BODY_SIZE < BOTTOM_MARGIN) newPage(ctx);
      ctx.y -= BODY_SIZE;
      if (i === 0) {
        ctx.page.drawText(safe(regular, label), { x: MARGIN_X, y: ctx.y, size: BODY_SIZE, font: regular });
        ctx.page.drawText(":", { x: MARGIN_X + META_LABEL_W, y: ctx.y, size: BODY_SIZE, font: regular });
      }
      ctx.page.drawText(line, { x: MARGIN_X + META_LABEL_W + 10, y: ctx.y, size: BODY_SIZE, font: bold });
      ctx.y -= lineHeight(BODY_SIZE) - BODY_SIZE;
    });
  }
  ctx.y -= 12;

  // ---- alamat surat (Yth.) ----
  // Formulir  -> Kepala Laboratorium; Surat persetujuan -> Teknisi/Asisten Laboratorium.
  const ythTarget = data.mode === "approval" ? "Teknisi/Asisten" : "Kepala";
  const ythLines = [
    `${ythTarget} Laboratorium ${data.bidang.map((b) => LAB_TITLE[b]).join(" serta ")}`,
    "Program Studi Teknik Perminyakan, Jurusan Teknik Mesin",
    "Fakultas Teknik Universitas Jember",
  ];
  const YTH_W = 28;
  ythLines.forEach((text, idx) => {
    wrap(regular, text, BODY_SIZE, CONTENT_W - YTH_W).forEach((line, j) => {
      if (ctx.y - BODY_SIZE < BOTTOM_MARGIN) newPage(ctx);
      ctx.y -= BODY_SIZE;
      if (idx === 0 && j === 0) ctx.page.drawText("Yth.", { x: MARGIN_X, y: ctx.y, size: BODY_SIZE, font: regular });
      ctx.page.drawText(line, { x: MARGIN_X + YTH_W, y: ctx.y, size: BODY_SIZE, font: regular });
      ctx.y -= lineHeight(BODY_SIZE) - BODY_SIZE;
    });
  });
  ctx.y -= 12;

  // ---- judul ----
  const title =
    data.mode === "approval"
      ? "SURAT PERSETUJUAN PEMINJAMAN ALAT DAN BAHAN LABORATORIUM"
      : "FORMULIR PEMINJAMAN ALAT DAN BAHAN LABORATORIUM";
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
  const sebutan = data.requester.status === "mahasiswa" ? "mahasiswa" : "pemohon";
  paragraph(ctx, data.mode === "approval" ? `Sehubungan dengan surat permohonan ${sebutan} tersebut di bawah ini:` : "Bersama ini kami sampaikan bahwa pemohon tersebut di bawah ini:", { gapAfter: 4 });
  const r = data.requester;
  const idRows: [string, string][] = [
    ["Nama", r.nama],
    [r.idLabel, r.idNumber ?? "-"],
    ["Program Studi", r.prodi ?? "-"],
  ];
  if (r.fakultas) idRows.push(["Fakultas", r.fakultas]);
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

  // ---- narasi (rata kiri-kanan) ----
  const labs = data.bidang.map((b) => `Laboratorium ${LAB_TITLE[b]}`).join(" serta ");
  const sameDay = data.tanggalPinjam === data.tanggalKembali;
  const keperluanClean = data.keperluan.trim().replace(/[.\s]+$/, "");
  const pada = sameDay
    ? `pada tanggal ${formatTanggalId(data.tanggalPinjam)}`
    : `pada tanggal ${formatTanggalId(data.tanggalPinjam)} sampai dengan ${formatTanggalId(data.tanggalKembali)}`;
  paragraphJustify(
    ctx,
    data.mode === "approval"
      ? `Mengenai penggunaan fasilitas ${labs}, Program Studi Teknik Perminyakan, Jurusan Teknik Mesin, Fakultas Teknik Universitas Jember ${pada}, mohon diberikan kemudahan dan izin penggunaan alat dan/atau bahan berikut kepada ${sebutan} tersebut di atas untuk ${keperluanClean}:`
      : `Mohon dapatnya untuk menggunakan fasilitas ${labs}, Program Studi Teknik Perminyakan, Jurusan Teknik Mesin, Fakultas Teknik Universitas Jember, berupa alat dan/atau bahan:`,
    { gapAfter: 6 }
  );

  // ---- tabel ----
  drawTable(ctx, data.items);
  ctx.y -= 12;

  // ---- penutup (mengikuti contoh surat resmi fakultas) ----
  const closing =
    data.mode === "approval"
      ? "Demikian, atas bantuan dan kerjasamanya disampaikan terima kasih."
      : `Peminjaman direncanakan ${pada} untuk ${keperluanClean}. ` +
        "Peminjam bersedia menggunakan alat dan bahan sesuai prosedur (SOP) laboratorium, menjaga keutuhannya, serta mengembalikannya tepat waktu dalam kondisi baik. " +
        "Demikian, atas bantuan dan kerjasamanya disampaikan terima kasih.";
  // Paragraf penutup selalu satu halaman dengan tanda tangan: kalau keduanya tidak muat
  // di sisa halaman, pindah bersama-sama (tidak ada halaman yang isinya cuma tanda tangan).
  const closingH = wrap(regular, closing, BODY_SIZE, CONTENT_W).length * lineHeight(BODY_SIZE);
  const signH = layoutSigners(ctx, data.signers).height;
  if (ctx.y - closingH - 16 < SIGN_BOTTOM + signH) newPage(ctx);
  paragraphJustify(ctx, closing);

  // ---- tanda tangan ----
  await drawSigners(ctx, data.signers);

  return await doc.save();
}
