export default function VisiMisiPage() {
  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Tentang Kami</p>
      <h1 className="text-3xl font-display font-semibold mb-8">Visi & Misi</h1>

      <div className="mb-10">
        <h2 className="font-display text-xl font-semibold mb-3">Visi</h2>
        <p className="text-core">
          Menjadi laboratorium teknik perminyakan yang unggul dalam pendidikan,
          penelitian, dan pengabdian masyarakat di tingkat nasional dan internasional.
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-3">Misi</h2>
        <ul className="text-core space-y-2 list-disc list-inside">
          <li>Menyediakan fasilitas praktikum yang relevan dengan standar industri.</li>
          <li>Mendorong penelitian terapan di bidang teknik perminyakan.</li>
          <li>Membangun kolaborasi dengan industri dan institusi riset.</li>
          <li>Mengembangkan kompetensi mahasiswa dan tenaga laboratorium.</li>
        </ul>
      </div>
    </div>
  );
}
