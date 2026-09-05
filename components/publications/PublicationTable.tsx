import { Publication } from "@/types";

export function PublicationTable({ publications }: { publications: Publication[] }) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-4">
        {publications.map((pub) => (
          <div key={pub.id} className="border border-line bg-mist/40 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-xs text-core">{pub.year}</span>
              <span className="font-mono text-[11px] uppercase text-core border border-line px-2 py-0.5">
                {pub.type}
              </span>
            </div>
            <p className="font-medium text-ink leading-snug">{pub.title}</p>
            <p className="mt-1.5 text-sm text-core">{pub.authors}</p>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: full table */}
      <div className="hidden md:block overflow-x-auto scroll-thin border border-line">
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
              <tr key={pub.id} className="border-b border-line last:border-0 hover:bg-mist/60 transition-colors">
                <td className="p-4 font-mono text-core">{pub.year}</td>
                <td className="p-4 text-ink font-medium">{pub.title}</td>
                <td className="p-4 text-core">{pub.authors}</td>
                <td className="p-4 text-core">{pub.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
