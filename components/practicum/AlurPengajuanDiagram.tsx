export function AlurPengajuanDiagram() {
  const petrol = "#0B3B4E";
  const rig = "#C9852E";
  const ink = "#0B1220";
  const core = "#6E7B6D";
  const line = "#D7DCD8";
  const mist = "#F6F7F5";
  const paper = "#EEF1EF";

  return (
    <svg
      viewBox="0 0 900 1930"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label="Diagram alur pengajuan kegiatan praktikum dan non-praktikum hingga selesai administrasi"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={core} />
        </marker>
      </defs>

      <rect width="900" height="1930" fill={paper} />

      {/* 1. Login */}
      <rect x="330" y="20" width="240" height="60" rx="4" fill={petrol} />
      <text x="450" y="55" textAnchor="middle" fill={paper} fontSize="16" fontFamily="Inter, sans-serif" fontWeight="600">
        Login via SSO UNEJ
      </text>
      <line x1="450" y1="80" x2="450" y2="120" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 2. Decision: jenis kegiatan */}
      <polygon points="450,120 570,180 450,240 330,180" fill={mist} stroke={petrol} strokeWidth="2" />
      <text x="450" y="175" textAnchor="middle" fill={ink} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Pilih Jenis
      </text>
      <text x="450" y="193" textAnchor="middle" fill={ink} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Kegiatan
      </text>

      <line x1="330" y1="180" x2="180" y2="180" stroke={core} strokeWidth="2" />
      <line x1="180" y1="180" x2="180" y2="280" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="220" y="172" fill={core} fontSize="12" fontFamily="Inter, sans-serif">Praktikum</text>

      <line x1="570" y1="180" x2="720" y2="180" stroke={core} strokeWidth="2" />
      <line x1="720" y1="180" x2="720" y2="280" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="690" y="172" fill={core} fontSize="12" fontFamily="Inter, sans-serif" textAnchor="end">Non-Praktikum</text>

      {/* 3a. Praktikum branch */}
      <rect x="60" y="280" width="240" height="110" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="180" y="308" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Isi Form Praktikum
      </text>
      <text x="180" y="330" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Pilih Praktikum
      </text>
      <text x="180" y="350" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Isi Modul
      </text>
      <text x="180" y="370" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Pilih Laboratorium
      </text>

      {/* 3b. Non-praktikum branch */}
      <rect x="600" y="280" width="240" height="110" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="720" y="308" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Isi Form Non-Praktikum
      </text>
      <text x="720" y="330" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Pilih Kategori Kegiatan
      </text>
      <text x="720" y="350" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Isi Deskripsi (jika &ldquo;Lainnya&rdquo;)
      </text>
      <text x="720" y="370" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        • Pilih Laboratorium
      </text>

      {/* merge lines to common node */}
      <line x1="180" y1="390" x2="180" y2="430" stroke={core} strokeWidth="2" />
      <line x1="180" y1="430" x2="450" y2="430" stroke={core} strokeWidth="2" />
      <line x1="720" y1="390" x2="720" y2="430" stroke={core} strokeWidth="2" />
      <line x1="720" y1="430" x2="450" y2="430" stroke={core} strokeWidth="2" />
      <line x1="450" y1="430" x2="450" y2="460" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 4. tanggal & jam */}
      <rect x="330" y="460" width="240" height="60" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="450" y="484" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Isi Tanggal &amp; Jam Kegiatan
      </text>
      <text x="450" y="502" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        (ada peringatan jika jadwal bentrok)
      </text>
      <line x1="450" y1="520" x2="450" y2="560" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 5. kirim pengajuan */}
      <rect x="300" y="560" width="300" height="60" rx="4" fill={petrol} />
      <text x="450" y="595" textAnchor="middle" fill={paper} fontSize="15" fontFamily="Inter, sans-serif" fontWeight="600">
        Kirim Pengajuan
      </text>
      <line x1="450" y1="620" x2="450" y2="660" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* status pending badge */}
      <rect x="365" y="660" width="170" height="34" rx="17" fill={mist} stroke={rig} strokeWidth="1.5" />
      <text x="450" y="682" textAnchor="middle" fill={rig} fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">
        STATUS: MENUNGGU
      </text>
      <line x1="450" y1="694" x2="450" y2="730" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 6. Decision admin */}
      <polygon points="450,730 590,800 450,870 310,800" fill={mist} stroke={petrol} strokeWidth="2" />
      <text x="450" y="795" textAnchor="middle" fill={ink} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Admin
      </text>
      <text x="450" y="813" textAnchor="middle" fill={ink} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Meninjau
      </text>

      {/* reject branch, loops back to revise form */}
      <line x1="310" y1="800" x2="140" y2="800" stroke={core} strokeWidth="2" />
      <text x="225" y="792" fill={core} fontSize="12" fontFamily="Inter, sans-serif" textAnchor="middle">Ditolak</text>
      <rect x="30" y="770" width="220" height="60" rx="4" fill="white" stroke={"#C0392B"} strokeWidth="1.5" />
      <text x="140" y="794" textAnchor="middle" fill={"#C0392B"} fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">
        Revisi &amp; Ajukan Ulang
      </text>
      <text x="140" y="812" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        (lihat catatan admin)
      </text>
      <path d="M140,770 L140,505 L330,505" fill="none" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* approve branch */}
      <line x1="450" y1="870" x2="450" y2="910" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />
      <text x="470" y="895" fill={core} fontSize="12" fontFamily="Inter, sans-serif">Disetujui</text>

      {/* status approved badge */}
      <rect x="360" y="910" width="180" height="34" rx="17" fill={mist} stroke={petrol} strokeWidth="1.5" />
      <text x="450" y="932" textAnchor="middle" fill={petrol} fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">
        STATUS: DISETUJUI
      </text>
      <line x1="450" y1="944" x2="450" y2="980" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 7. muncul di jadwal */}
      <rect x="300" y="980" width="300" height="60" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="450" y="1005" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Muncul di Menu Jadwal
      </text>
      <text x="450" y="1023" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        (dapat dilihat publik)
      </text>
      <line x1="450" y1="1040" x2="450" y2="1080" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 8. laksanakan kegiatan */}
      <rect x="300" y="1080" width="300" height="60" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="450" y="1116" textAnchor="middle" fill={ink} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Laksanakan Kegiatan
      </text>
      <line x1="450" y1="1140" x2="450" y2="1180" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* 9. lengkapi administrasi */}
      <rect x="270" y="1180" width="360" height="60" rx="4" fill={rig} />
      <text x="450" y="1207" textAnchor="middle" fill={paper} fontSize="15" fontFamily="Inter, sans-serif" fontWeight="600">
        Klik &ldquo;Lengkapi Administrasi&rdquo;
      </text>
      <text x="450" y="1227" textAnchor="middle" fill={paper} fontSize="11" fontFamily="Inter, sans-serif">
        (baru bisa setelah kegiatan berakhir)
      </text>
      <line x1="450" y1="1240" x2="450" y2="1280" stroke={core} strokeWidth="2" />

      {/* branch: dokumentasi + insiden + peminjaman */}
      <line x1="150" y1="1280" x2="750" y2="1280" stroke={core} strokeWidth="2" />
      <line x1="150" y1="1280" x2="150" y2="1310" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="450" y1="1280" x2="450" y2="1310" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="750" y1="1280" x2="750" y2="1310" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      <rect x="20" y="1310" width="260" height="130" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="150" y="1338" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Upload Dokumentasi
      </text>
      <text x="150" y="1360" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        Praktikum: pre test, tes alat,
      </text>
      <text x="150" y="1376" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        pelaksanaan praktikum
      </text>
      <text x="150" y="1396" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        Non-praktikum: dokumentasi kegiatan
      </text>
      <text x="150" y="1418" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        (gambar/PDF, maks. 2 berkas @ 1 MB)
      </text>

      <rect x="320" y="1310" width="260" height="130" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="450" y="1338" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Laporan Insiden (Ya/Tidak)
      </text>
      <text x="450" y="1360" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        Jika ya: jenis insiden,
      </text>
      <text x="450" y="1376" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        nama alat/bahan &amp; jumlah,
      </text>
      <text x="450" y="1392" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        penyebab, pihak terkait,
      </text>
      <text x="450" y="1408" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        ganti rugi + dokumentasi insiden
      </text>

      <rect x="620" y="1310" width="260" height="130" rx="4" fill="white" stroke={line} strokeWidth="1.5" />
      <text x="750" y="1338" textAnchor="middle" fill={ink} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
        Peminjaman Alat/Bahan (Ya/Tidak)
      </text>
      <text x="750" y="1360" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        Jika ya: pilih alat dan/atau
      </text>
      <text x="750" y="1376" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        bahan, lalu isi item,
      </text>
      <text x="750" y="1392" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        jumlah &amp; satuan
      </text>

      <line x1="150" y1="1440" x2="150" y2="1470" stroke={core} strokeWidth="2" />
      <line x1="450" y1="1440" x2="450" y2="1470" stroke={core} strokeWidth="2" />
      <line x1="750" y1="1440" x2="750" y2="1470" stroke={core} strokeWidth="2" />
      <line x1="150" y1="1470" x2="750" y2="1470" stroke={core} strokeWidth="2" />
      <line x1="450" y1="1470" x2="450" y2="1510" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* submit completion */}
      <rect x="330" y="1510" width="240" height="60" rx="4" fill={petrol} />
      <text x="450" y="1546" textAnchor="middle" fill={paper} fontSize="14" fontFamily="Inter, sans-serif" fontWeight="600">
        Submit Penyelesaian
      </text>
      <line x1="450" y1="1570" x2="450" y2="1610" stroke={core} strokeWidth="2" markerEnd="url(#arrow)" />

      {/* end */}
      <rect x="360" y="1610" width="180" height="60" rx="30" fill={petrol} />
      <text x="450" y="1646" textAnchor="middle" fill={paper} fontSize="15" fontFamily="Inter, sans-serif" fontWeight="700">
        STATUS: SELESAI
      </text>

      {/* optional: revisi administrasi */}
      <line x1="450" y1="1670" x2="450" y2="1710" stroke={core} strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#arrow)" />
      <text x="470" y="1696" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        Jika admin/asisten meminta revisi
      </text>
      <rect x="150" y="1710" width="600" height="150" rx="4" fill="white" stroke={rig} strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="450" y="1738" textAnchor="middle" fill={rig} fontSize="13" fontFamily="Inter, sans-serif" fontWeight="700">
        Revisi Administrasi
      </text>
      <text x="450" y="1764" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        1. Klik &ldquo;Revisi Administrasi&rdquo; &mdash; form terisi data sebelumnya
      </text>
      <text x="450" y="1786" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        2. Perbaiki &amp; kirim ulang &rarr; STATUS: MENUNGGU VERIFIKASI
      </text>
      <text x="450" y="1808" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        3. Admin/asisten ACC &rarr; kembali ke STATUS: SELESAI
      </text>
      <text x="450" y="1834" textAnchor="middle" fill={core} fontSize="11" fontFamily="Inter, sans-serif">
        (jika belum sesuai, revisi diminta lagi; pengajuan baru belum bisa dibuat selama revisi berjalan)
      </text>

      <text x="450" y="1900" textAnchor="middle" fill={core} fontSize="12" fontFamily="Inter, sans-serif">
        Semua tahap dilakukan lewat akun SSO UNEJ yang sama: Layanan Lab &rarr; Pengajuan Kegiatan, lalu menu Status Pengajuan.
      </text>
    </svg>
  );
}
