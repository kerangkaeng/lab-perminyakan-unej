import { Publication } from "@/types";

export function PublicationTable({ publications }: { publications: Publication[] }) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
            <th className="text-left p-4">Tahun</th>
            <th className="text-left p-4">Judul</th>
            <th className="text-left p-4">Penulis</th>
            <th className="text-left p-4">Jenis</th>
          </tr>
        </thead>
        <tbody>
          {publications.map((pub) => (
            <tr key={pub.id} className="border-b border-line last:border-0">
              <td className="p-4 font-mono text-core">{pub.year}</td>
              <td className="p-4 text-ink font-medium">{pub.title}</td>
              <td className="p-4 text-core">{pub.authors}</td>
              <td className="p-4 text-core">{pub.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
