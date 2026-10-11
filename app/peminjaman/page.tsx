import Link from "next/link";

// Placeholder: fitur pengajuan peminjaman (alat/bahan/ruang) belum
// diimplementasikan. Halaman ini sengaja dibuat lebih dulu supaya menu
// "Layanan Lab" tidak mengarah ke 404.
export default function PeminjamanPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Layanan Lab</p>
      <h1 className="mb-6 text-3xl font-display font-semibold md:text-4xl">Pengajuan Peminjaman</h1>
      <div className="max-w-xl border border-line bg-mist p-6">
        <p className="font-display text-lg font-semibold text-ink">Segera hadir</p>
        <p className="mt-2 text-sm text-core">
          Fitur pengajuan peminjaman sedang dalam pengembangan. Untuk saat ini, peminjaman alat dan bahan
          dilaporkan bersama administrasi penyelesaian kegiatan.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/practicum/ajukan"
            className="bg-petrol px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-petrol-light"
          >
            Pengajuan Kegiatan
          </Link>
          <Link href="/contact" className="border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-paper">
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}
