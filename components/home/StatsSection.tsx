const items = [
  { label: "Keunggulan", value: "Alat uji standar API & industri" },
  { label: "Kolaborasi", value: "Kerja sama riset dengan industri migas" },
  { label: "SDM", value: "Dosen, peneliti, dan laboran berpengalaman" },
  { label: "Akses", value: "Terbuka untuk praktikum & riset mahasiswa" },
];

export function StatsSection() {
  return (
    <section className="container-lab py-14 sm:py-16 border-b border-line">
      <p className="eyebrow mb-3">Keunggulan Laboratorium</p>
      <h2 className="text-2xl md:text-3xl font-display font-semibold mb-10 max-w-lg">
        Fasilitas dan dukungan riset kelas industri
      </h2>
      <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-t-2 border-rig pt-4 transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="font-mono text-xs uppercase tracking-wide text-core mb-2">{item.label}</p>
            <p className="text-ink text-sm sm:text-base">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
