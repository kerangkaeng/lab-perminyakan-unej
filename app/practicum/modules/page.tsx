import Link from "next/link";
import { facilities } from "@/data/facilities";

export default function ModulesPage() {
  const modules = facilities.flatMap((f) =>
    (f.modules ?? []).map((m) => ({ title: m, facility: f.name, slug: `${f.slug}-${m.toLowerCase().replace(/\s+/g, "-")}` }))
  );

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Modul Praktikum</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.slug}
            href={`/practicum/modules/${m.slug}`}
            className="border border-line p-5 hover:border-petrol transition-colors"
          >
            <p className="font-medium text-ink">{m.title}</p>
            <p className="text-xs text-core font-mono mt-1">{m.facility}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
