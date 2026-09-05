const items = [
  { label: "Keunggulan", value: "Alat uji standar API & industri" },
  { label: "Kolaborasi", value: "Kerja sama riset dengan industri migas" },
  { label: "SDM", value: "Dosen, peneliti, dan laboran berpengalaman" },
  { label: "Akses", value: "Terbuka untuk praktikum & riset mahasiswa" },
];

export function StatsSection() {
  return (
    <section className="container-lab section-space">
      <div className="section-heading">
        <p className="eyebrow mb-4">Keunggulan Laboratorium</p>
        <h2 className="text-3xl font-display font-semibold sm:text-4xl md:text-5xl">
          Fasilitas dan dukungan riset kelas industri
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="transition-transform duration-500 hover:-translate-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest2 text-rig mb-4">{item.label}</p>
            <p className="font-display text-lg leading-snug text-ink sm:text-xl">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
