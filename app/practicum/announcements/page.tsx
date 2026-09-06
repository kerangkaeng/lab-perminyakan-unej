const announcements: { title: string; date: string; href?: string }[] = [];

export default function AnnouncementsPage() {
  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Pengumuman</h1>
      {announcements.length === 0 ? (
        <p className="text-core text-sm">Belum ada pengumuman.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.title} className="border-b border-line pb-4">
              <p className="font-mono text-xs text-core mb-1">{a.date}</p>
              <p className="text-ink font-medium">{a.title}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
