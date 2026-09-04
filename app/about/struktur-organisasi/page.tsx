export default function StrukturOrganisasiPage() {
  const roles = [
    "Kepala Laboratorium",
    "Sekretaris / Koordinator",
    "Laboran",
    "Asisten Laboratorium",
    "Dosen / Peneliti",
  ];

  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Tentang Kami</p>
      <h1 className="text-3xl font-display font-semibold mb-8">Struktur Organisasi</h1>
      <ol className="space-y-4">
        {roles.map((r, i) => (
          <li key={r} className="flex items-center gap-4 border-b border-line pb-4">
            <span className="font-mono text-xs text-rig">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-ink">{r}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
