import Link from "next/link";

const links = [
{ href: "/practicum/modules", label: "Modul Praktikum", desc: "Unduh modul untuk setiap laboratorium." },
{ href: "/practicum/jadwal", label: "Jadwal Praktikum", desc: "Jadwal praktikum yang sudah disetujui admin, terupdate otomatis." },
@@ -8,3 +10,34 @@ const accountLinks = [
{ href: "/practicum/ajukan", label: "Ajukan Praktikum", desc: "Mahasiswa mengajukan jadwal kegiatan praktikum baru." },
{ href: "/practicum/status", label: "Status Pengajuan", desc: "Pantau status pengajuan yang sudah kamu kirim." },
];

export default function PracticumPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Practicum</h1>
      <div className="grid gap-6 sm:grid-cols-3 mb-16">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="border border-line p-6 hover:border-petrol transition-colors">
            <p className="font-display text-lg font-semibold mb-2">{l.label}</p>
            <p className="text-sm text-core">{l.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-display font-semibold mb-2">Pengajuan Jadwal (Login SSO UNEJ)</h2>
      <p className="text-sm text-core mb-6 max-w-xl">
        Mahasiswa bisa mengajukan jadwal praktikum langsung lewat akun SISTER UNEJ,
        yang kemudian ditinjau oleh admin laboratorium.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {accountLinks.map((l) => (
          <Link key={l.href} href={l.href} className="border border-line p-6 hover:border-petrol transition-colors">
            <p className="font-display text-lg font-semibold mb-2">{l.label}</p>
            <p className="text-sm text-core">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
