import Link from "next/link";
import { ResearchProject } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function ResearchCard({ project }: { project: ResearchProject }) {
  return (
    <Link
      href={`/research/projects/${project.slug}`}
      className="block border border-line bg-mist/40 p-6 surface-hover hover:border-petrol"
    >
      <div className="flex gap-2 mb-4 flex-wrap">
        <Badge>{project.field}</Badge>
        <Badge>{project.status}</Badge>
        <Badge>{project.year}</Badge>
      </div>
      <h3 className="font-display text-lg font-semibold text-ink mb-2">{project.title}</h3>
      <p className="text-sm text-core">{project.researcher}</p>
    </Link>
  );
}
