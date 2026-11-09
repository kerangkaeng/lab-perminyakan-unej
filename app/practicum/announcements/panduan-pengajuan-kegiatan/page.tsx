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
        hingga melengkapi administrasi (dokumentasi, laporan insiden, dan peminjaman
        alat/bahan) setelah kegiatan berlangsung.
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
          <h2 className="text-xl font-display font-semibold mb-3">2. Buka menu &ldquo;Pengajuan Kegiatan&rdquo;</h2>
          <p className="text-core mb-2">
            Buka menu <strong className="text-ink">Layanan Lab → Pengajuan Kegiatan</strong>{" "}
            di bagian atas situs. Setelah login, kamu juga bisa membukanya dari menu samping{" "}
            <strong className="text-ink">Ajukan Kegiatan</strong>. Jika belum login, kamu akan
            diarahkan ke halaman login dulu lalu dikembalikan ke halaman ini.
          </p>
          <p className="text-sm text-core border border-rig/40 bg-rig/5 px-4 py-3 mt-3">
            <strong className="text-ink">Perlu diperhatikan:</strong> form pengajuan tidak akan
            muncul jika kamu masih punya kegiatan yang administrasinya belum beres — yaitu
            kegiatan yang sudah lewat tetapi belum dilengkapi administrasinya, atau administrasi
            yang sedang diminta/menunggu verifikasi revisi (lihat langkah 7 &amp; 8). Selesaikan
            dulu lewat <strong className="text-ink">Status Pengajuan</strong>.
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
                <li>Pilih praktikum</li>
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
                <li>Lainnya (wajib isi deskripsi kegiatan)</li>
              </ul>
              <p className="text-xs text-core mt-2">Laboratorium tetap dipilih seperti praktikum.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">4. Isi tanggal &amp; jam, lalu kirim</h2>
          <p className="text-core mb-3">
            Lengkapi tanggal, jam mulai, dan jam selesai kegiatan, lalu klik{" "}
            <strong className="text-ink">Kirim Pengajuan</strong>. Status pengajuan akan
            tercatat sebagai <span className="font-mono text-rig">Menunggu</span>.
          </p>
          <ul className="text-sm text-core space-y-1 list-disc list-inside">
            <li>Tanggal kegiatan tidak boleh sudah lewat, dan jam selesai harus setelah jam mulai.</li>
            <li>
              Setelah laboratorium, tanggal, dan jam terisi, sistem otomatis memeriksa jadwal di
              laboratorium tersebut. Jika ada kegiatan lain di jam yang sama/berdekatan, muncul{" "}
              <strong className="text-ink">peringatan bentrok</strong> (menandai yang sudah disetujui
              dan yang masih menunggu).
            </li>
            <li>
              Peringatan itu <strong className="text-ink">tidak memblokir</strong>: kamu tetap bisa
              mengirim pengajuan, dan admin yang memutuskan dengan mempertimbangkan bentrok tersebut.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">5. Tunggu tinjauan admin</h2>
          <p className="text-core mb-2">
            Admin laboratorium akan meninjau pengajuan kamu. Pantau statusnya lewat menu{" "}
            <strong className="text-ink">Status Pengajuan</strong>:
          </p>
          <ul className="text-sm text-core space-y-1 list-disc list-inside">
            <li><strong className="text-ink">Disetujui</strong> — jadwal otomatis tampil di menu Jadwal (bisa dilihat publik).</li>
            <li><strong className="text-ink">Ditolak</strong> — baca catatan admin di kolom Catatan Admin, perbaiki, lalu ajukan ulang dari awal.</li>
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
            Setelah jam selesai kegiatan terlewati, buka lagi menu{" "}
            <strong className="text-ink">Status Pengajuan</strong>, lalu klik tombol{" "}
            <strong className="text-ink">&ldquo;Lengkapi Administrasi&rdquo;</strong> pada baris
            kegiatan yang sudah disetujui. Tombol ini belum bisa dipakai sebelum kegiatan berakhir.
            Ada tiga bagian yang perlu diisi:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Upload Dokumentasi (wajib)</p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Praktikum: dokumentasi pre test, tes alat, dan praktikum</li>
                <li>Non-praktikum: dokumentasi kegiatan</li>
                <li>Format gambar atau PDF, maks. 1 MB per berkas</li>
                <li>Maks. 2 berkas untuk tiap jenis dokumentasi</li>
              </ul>
            </div>
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Laporan Insiden (wajib dijawab)</p>
              <p className="text-sm text-core mb-2">
                Pilih Ya/Tidak untuk pertanyaan &ldquo;Apakah terjadi insiden selama kegiatan?&rdquo;.
                Jika <strong className="text-ink">Ya</strong>, isi:
              </p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Jenis insiden (rusak/pecah, hilang, tumpah, atau lainnya)</li>
                <li>Nama alat/bahan dan jumlahnya</li>
                <li>Penyebab dan pihak terkait</li>
                <li>Bentuk ganti rugi/pertanggungjawaban</li>
                <li>Dokumentasi insiden</li>
              </ul>
            </div>
            <div className="border border-line p-4">
              <p className="font-medium text-ink mb-2">Peminjaman Alat/Bahan (wajib dijawab)</p>
              <p className="text-sm text-core mb-2">
                Pilih Ya/Tidak untuk pertanyaan &ldquo;Apakah ada peminjaman alat/bahan?&rdquo;.
                Jika <strong className="text-ink">Ya</strong>:
              </p>
              <ul className="text-sm text-core space-y-1 list-disc list-inside">
                <li>Pilih apakah meminjam alat, bahan, atau keduanya</li>
                <li>Pilih item dari daftar, lalu isi jumlah dan satuan</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-core mt-3">
            Untuk meminjam alat/bahan secara terpisah dari kegiatan (dengan dokumen PDF
            peminjaman), gunakan menu{" "}
            <strong className="text-ink">Layanan Lab → Pengajuan Peminjaman</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-display font-semibold mb-3">8. Selesai &amp; kemungkinan revisi</h2>
          <p className="text-core mb-4">
            Setelah dikirim, kolom Administrasi pada Status Pengajuan berubah menjadi{" "}
            <span className="font-mono text-petrol">Selesai</span> dan kamu bebas mengajukan
            kegiatan berikutnya.
          </p>
          <p className="text-core mb-2">
            Jika admin atau asisten menemukan isian yang perlu diperbaiki (misalnya salah pilih
            alat atau salah jumlah), mereka dapat membuka kembali administrasi untuk revisi:
          </p>
          <ol className="text-sm text-core space-y-1 list-decimal list-inside mb-4">
            <li>
              Tombol pada kegiatan itu berubah menjadi{" "}
              <strong className="text-ink">&ldquo;Revisi Administrasi&rdquo;</strong>; baca catatan
              revisi di kolom Catatan Admin.
            </li>
            <li>
              Form terisi otomatis dengan data sebelumnya — ubah bagian yang salah, lalu kirim
              ulang.
            </li>
            <li>
              Status menjadi <span className="font-mono text-rig">Menunggu Verifikasi</span>; kamu
              tidak bisa mengubah apa pun selama revisi diperiksa.
            </li>
            <li>
              Jika disetujui (ACC), status kembali <span className="font-mono text-petrol">Selesai</span>.
              Jika belum sesuai, kamu diminta merevisi lagi sesuai catatan.
            </li>
          </ol>
          <p className="text-xs text-core">
            Selama revisi masih diminta atau menunggu verifikasi, pengajuan kegiatan baru belum
            bisa dibuat.
          </p>
        </section>
      </div>
    </div>
  );
}
