const categories = [
  "Praktikum", "Training", "Workshop", "Seminar",
  "Kunjungan Industri", "Kunjungan Sekolah", "Penelitian", "Pengabdian Masyarakat",
];

export default function GalleryPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Dokumentasi</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Gallery</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c} className="aspect-[4/3] bg-mist border border-line flex items-end p-4">
            <span className="font-mono text-xs uppercase text-core">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
