import Link from "next/link";
import { researchProjects } from "@/data/research";
import { Badge } from "@/components/ui/Badge";

export function FeaturedResearch() {
  return (
    <section className="container-lab py-16 border-b border-line">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow mb-3">Penelitian Terbaru</p>
          <h2 className="text-2xl md:text-3xl font-display font-semibold">Riset yang sedang berjalan</h2>
        </div>
        <Link href="/research" className="text-sm text-petrol hover:text-rig hidden sm:inline">
          Lihat semua →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {researchProjects.map((p) => (
          <Link
            key={p.slug}
            href={`/research/projects/${p.slug}`}
            className="block border border-line p-6 hover:border-petrol transition-colors"
          >
            <div className="flex gap-2 mb-4">
              <Badge>{p.field}</Badge>
              <Badge>{p.status}</Badge>
              <Badge>{p.year}</Badge>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink mb-2">{p.title}</h3>
            <p className="text-sm text-core">{p.researcher}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
