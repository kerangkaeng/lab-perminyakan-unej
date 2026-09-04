import Link from "next/link";
import { researchAreas, researchProjects } from "@/data/research";
import { ResearchCard } from "@/components/research/ResearchCard";

export default function ResearchPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Research</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Research Areas</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-16">
        {researchAreas.map((a) => (
          <div key={a.slug} className="border-t-2 border-rig pt-4">
            <p className="font-display font-semibold text-ink mb-1">{a.name}</p>
            <p className="text-sm text-core">{a.description}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between mb-8">
        <h2 className="text-2xl font-display font-semibold">Research Projects</h2>
        <Link href="/research/researchers" className="text-sm text-petrol hover:text-rig">
          Lihat Researchers →
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {researchProjects.map((p) => (
          <ResearchCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
