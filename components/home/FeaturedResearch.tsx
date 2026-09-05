import Link from "next/link";
import { researchProjects } from "@/data/research";
import { Badge } from "@/components/ui/Badge";

export function FeaturedResearch() {
  return (
    <section className="container-lab py-14 sm:py-16 border-b border-line">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow mb-3">Penelitian Terbaru</p>
          <h2 className="text-2xl md:text-3xl font-display font-semibold">Riset yang sedang berjalan</h2>
        </div>
        <Link href="/research" className="text-sm text-petrol hover:text-rig transition-colors">
          Lihat semua →
        </Link>
      </div>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        {researchProjects.map((p) => (
          <Link
            key={p.slug}
            href={`/research/projects/${p.slug}`}
            className="block border border-line bg-mist/40 p-6 surface-hover hover:border-petrol"
          >
            <div className="flex gap-2 mb-4 flex-wrap">
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
