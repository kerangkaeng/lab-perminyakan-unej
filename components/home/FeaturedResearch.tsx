import Link from "next/link";
import { researchProjects } from "@/data/research";
import { Badge } from "@/components/ui/Badge";

export function FeaturedResearch() {
  return (
    <section className="container-lab section-space border-t border-line">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6 sm:mb-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-4">Penelitian Terbaru</p>
          <h2 className="text-3xl font-display font-semibold sm:text-4xl md:text-5xl">
            Riset yang sedang berjalan
          </h2>
        </div>
        <Link href="/research" className="text-sm text-petrol transition-colors hover:text-rig">
          Lihat semua →
        </Link>
      </div>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {researchProjects.map((p) => (
          <Link
            key={p.slug}
            href={`/research/projects/${p.slug}`}
            className="group surface-hover block border-b border-line pb-10"
          >
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{p.field}</Badge>
              <Badge>{p.status}</Badge>
              <Badge>{p.year}</Badge>
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink transition-colors group-hover:text-rig">
              {p.title}
            </h3>
            <p className="mt-3 text-sm text-core">{p.researcher}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
