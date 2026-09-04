const schedule = [
  { group: "Kelompok 1", lab: "PVT Laboratory", day: "Senin", time: "08.00 – 10.00" },
  { group: "Kelompok 2", lab: "Drilling Fluid Laboratory", day: "Senin", time: "10.00 – 12.00" },
  { group: "Kelompok 3", lab: "Petrophysics Laboratory", day: "Selasa", time: "08.00 – 10.00" },
];

export default function SchedulePage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Jadwal Praktikum</h1>
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
              <th className="text-left p-4">Kelompok</th>
              <th className="text-left p-4">Laboratorium</th>
              <th className="text-left p-4">Hari</th>
              <th className="text-left p-4">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((s) => (
              <tr key={s.group + s.lab} className="border-b border-line last:border-0">
                <td className="p-4 text-ink font-medium">{s.group}</td>
                <td className="p-4 text-core">{s.lab}</td>
                <td className="p-4 text-core">{s.day}</td>
                <td className="p-4 text-core font-mono">{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
