import { notFound } from "next/navigation";
import { researchProjects } from "@/data/research";
import { Badge } from "@/components/ui/Badge";

export function generateStaticParams() {
  return researchProjects.map((p) => ({ slug: p.slug }));
}

export default function ResearchProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = researchProjects.find((p) => p.slug === params.slug);
  if (!project) return notFound();

  return (
    <div className="container-lab py-16 max-w-2xl">
      <div className="flex gap-2 mb-6 flex-wrap">
        <Badge>{project.field}</Badge>
        <Badge>{project.status}</Badge>
        <Badge>{project.year}</Badge>
      </div>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">{project.title}</h1>
      <p className="text-sm text-core mb-8">Researcher: {project.researcher}</p>
      <p className="text-core">{project.abstract}</p>
    </div>
  );
}
