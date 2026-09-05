import { Equipment } from "@/types";

export function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
  return (
    <>
      {/* Mobile: stacked cards (md:hidden) */}
      <div className="md:hidden space-y-4">
        {equipment.map((e) => (
          <div key={e.name} className="border border-line bg-mist/40 p-4">
            <p className="font-display font-semibold text-ink mb-2">{e.name}</p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="font-mono text-[11px] uppercase text-core shrink-0 w-24 pt-0.5">Spesifikasi</dt>
                <dd className="text-ink">{e.spec}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-mono text-[11px] uppercase text-core shrink-0 w-24 pt-0.5">Fungsi</dt>
                <dd className="text-core">{e.function}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: full table (hidden below md) */}
      <div className="hidden md:block overflow-x-auto scroll-thin border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
              <th className="text-left p-4">Nama Alat</th>
              <th className="text-left p-4">Spesifikasi</th>
              <th className="text-left p-4">Fungsi</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((e) => (
              <tr key={e.name} className="border-b border-line last:border-0 hover:bg-mist/60 transition-colors">
                <td className="p-4 font-medium text-ink">{e.name}</td>
                <td className="p-4 text-core">{e.spec}</td>
                <td className="p-4 text-core">{e.function}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
