import { Equipment } from "@/types";

export function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
  return (
    <div className="overflow-x-auto border border-line">
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
            <tr key={e.name} className="border-b border-line last:border-0">
              <td className="p-4 font-medium text-ink">{e.name}</td>
              <td className="p-4 text-core">{e.spec}</td>
              <td className="p-4 text-core">{e.function}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
