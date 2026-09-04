import Link from "next/link";

const subpages = [
  { href: "/about/visi-misi", label: "Visi & Misi" },
  { href: "/about/struktur-organisasi", label: "Struktur Organisasi" },
  { href: "/about/team", label: "Team" },
];

export default function AboutPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Tentang Kami</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-6">Profil Laboratorium</h1>
      <p className="text-core max-w-2xl mb-10">
        Laboratorium Teknik Perminyakan berdiri sebagai pusat pembelajaran praktikum,
        penelitian, dan pengabdian masyarakat di bidang teknik perminyakan, mendukung
        kompetensi mahasiswa sekaligus riset terapan bersama industri.
      </p>

      <div className="grid gap-6 sm:grid-cols-3 mb-16">
        {subpages.map((s) => (
          <Link key={s.href} href={s.href} className="border border-line p-6 hover:border-petrol transition-colors">
            <p className="font-display text-lg font-semibold">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-xl font-semibold mb-3">Sejarah</h2>
          <p className="text-core text-sm">
            Tuliskan sejarah singkat pendirian laboratorium, perkembangan fasilitas,
            dan pencapaian penting dari waktu ke waktu di sini.
          </p>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold mb-3">Struktur Pengelola</h2>
          <ul className="text-core text-sm space-y-1">
            <li>Kepala Laboratorium</li>
            <li>Laboran</li>
            <li>Asisten Laboratorium</li>
            <li>Dosen / Peneliti</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
