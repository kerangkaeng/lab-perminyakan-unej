import { researchProjects } from "@/data/research";
import { ResearchCard } from "@/components/research/ResearchCard";

export default function ResearchProjectsPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Research</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Research Projects</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {researchProjects.map((p) => (
          <ResearchCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
