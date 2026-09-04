import Link from "next/link";

const links = [
  { href: "/practicum/modules", label: "Modul Praktikum", desc: "Unduh modul untuk setiap laboratorium." },
  { href: "/practicum/schedule", label: "Jadwal Praktikum", desc: "Jadwal pelaksanaan per kelompok." },
  { href: "/practicum/announcements", label: "Pengumuman", desc: "Informasi dan tata tertib terbaru." },
];

export default function PracticumPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Practicum</h1>
      <div className="grid gap-6 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="border border-line p-6 hover:border-petrol transition-colors">
            <p className="font-display text-lg font-semibold mb-2">{l.label}</p>
            <p className="text-sm text-core">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
