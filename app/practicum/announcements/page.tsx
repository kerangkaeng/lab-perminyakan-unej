import Link from "next/link";

const announcements = [
  {
    title: "Panduan Mengajukan Kegiatan (Praktikum & Non-Praktikum)",
    date: "2026-09-05",
    href: "/practicum/announcements/panduan-pengajuan-kegiatan",
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Pengumuman</h1>
      <ul className="space-y-4">
        {announcements.map((a) =>
          a.href ? (
            <li key={a.title} className="border-b border-line pb-4">
              <p className="font-mono text-xs text-core mb-1">{a.date}</p>
              <Link href={a.href} className="text-ink font-medium hover:text-petrol">
                {a.title}
              </Link>
            </li>
          ) : (
            <li key={a.title} className="border-b border-line pb-4">
              <p className="font-mono text-xs text-core mb-1">{a.date}</p>
              <p className="text-ink font-medium">{a.title}</p>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
