import Link from "next/link";
import { AlurPengajuanDiagram } from "@/components/practicum/AlurPengajuanDiagram";

export default function PanduanPengajuanKegiatanPage() {
  return (
    <div className="container-lab py-16 max-w-3xl">
      <Link href="/practicum/announcements" className="text-sm text-petrol hover:text-rig">
        &larr; Kembali ke Pengumuman
      </Link>

      <p className="eyebrow mt-6 mb-3">Praktikum · Panduan</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">
        Panduan Mengajukan Kegiatan (Praktikum &amp; Non-Praktikum)
      </h1>
      <p className="text-core mb-10 max-w-2xl">
        Panduan ini menjelaskan seluruh alur pengajuan kegiatan di Laboratorium Teknik
        Perminyakan, mulai dari login, mengajukan jadwal, menunggu persetujuan admin,
        hingga menyelesaikan administrasi (dokumentasi dan pelaporan insiden) setelah
        kegiatan berlangsung.
      </p>

      <div className="border border-line bg-mist p-4 mb-16">
        <AlurPengajuanDiagram />
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-display font-semibold mb-3">1. Login lewat SSO UNEJ</h2>
          <p className="text-core mb-2">
            Klik menu <strong className="text-ink">Masuk</strong> di pojok kanan atas, lalu
            login menggunakan akun SISTER UNEJ kamu (NIM &amp; password yang sama dengan
            SISTER). Tidak ada akun/password terpisah untuk situs ini.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">2. Buka menu &ldquo;Ajukan Kegiatan&rdquo;</h2>
          <p className="text-core mb-2">
            Setelah login, buka menu <strong className="text-ink">Praktikum → Ajukan Kegiatan</strong>.
            Di sini kamu akan memilih jenis kegiatan yang ingin diajukan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">3. Pilih jenis kegiatan</h2>
          <p className="text-core mb-4">
            Ada dua jenis kegiatan yang bisa diajukan — pilih salah satu, karena isian
            selanjutnya akan menyesuaikan:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Praktikum</p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Pilih mata kuliah praktikum</li>
                <li>Isi modul yang akan dilaksanakan</li>
                <li>Pilih laboratorium</li>
              </ul>
            </div>
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Non-Praktikum</p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Penelitian atau Riset</li>
                <li>Seminar Kerja Praktik</li>
                <li>Seminar Hasil Penelitian</li>
                <li>Bimbingan/Diskusi Akademik</li>
                <li>Kegiatan Akademik (KBM)</li>
                <li>Lainnya (wajib isi deskripsi)</li>
              </ul>
              <p className="text-xs text-core mt-2">Laboratorium tetap dipilih seperti praktikum.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">4. Isi tanggal &amp; jam, lalu kirim</h2>
          <p className="text-core mb-2">
            Lengkapi tanggal, jam mulai, dan jam selesai kegiatan, lalu klik{" "}
            <strong className="text-ink">Kirim Pengajuan</strong>. Status pengajuan akan
            berubah menjadi <span className="font-mono text-rig">PENDING</span>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">5. Tunggu tinjauan admin</h2>
          <p className="text-core mb-2">
            Admin laboratorium akan meninjau pengajuan kamu. Pantau statusnya lewat menu{" "}
            <strong className="text-ink">Status Pengajuan</strong>:
          </p>
          <ul className="text-sm text-core space-y-1 list-disc list-inside">
            <li><strong className="text-ink">Disetujui</strong> — jadwal otomatis tampil di menu Jadwal (bisa dilihat publik).</li>
            <li><strong className="text-ink">Ditolak</strong> — baca catatan admin, perbaiki, lalu ajukan ulang dari awal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">6. Laksanakan kegiatan</h2>
          <p className="text-core mb-2">
            Laksanakan kegiatan sesuai jadwal yang sudah disetujui, di laboratorium yang
            dipilih.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">7. Lengkapi administrasi</h2>
          <p className="text-core mb-4">
            Setelah kegiatan selesai, buka lagi menu <strong className="text-ink">Status Pengajuan</strong>,
            lalu klik tombol <strong className="text-ink">&ldquo;Lengkapi Administrasi&rdquo;</strong> pada
            baris kegiatan yang sudah disetujui. Ada dua hal yang perlu diisi:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Upload Dokumentasi</p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Praktikum: dokumentasi pretest, tes alat, dan pelaksanaan praktikum</li>
                <li>Non-praktikum: dokumentasi kegiatan</li>
              </ul>
            </div>
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Lapor Insiden (jika ada)</p>
              <p className="text-sm text-core">
                Kalau ada alat rusak/pecah, hilang, tumpah, atau kejadian lain selama
                kegiatan, laporkan lewat form yang sama — sertakan nama alat, jumlah,
                penyebab, pihak terkait, dan pihak yang bertanggung jawab.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">8. Selesai</h2>
          <p className="text-core mb-2">
            Setelah submit, status kegiatan berubah menjadi{" "}
            <span className="font-mono text-petrol">SELESAI</span> dan seluruh proses
            pengajuan kegiatan ini tuntas.
          </p>
        </section>
      </div>
    </div>
  );
}
