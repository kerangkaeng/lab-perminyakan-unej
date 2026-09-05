import Link from "next/link";
import { ResearchProject } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function ResearchCard({ project }: { project: ResearchProject }) {
  return (
    <Link href={`/research/projects/${project.slug}`} className="group surface-hover block border-b border-line pb-10">
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge>{project.field}</Badge>
        <Badge>{project.status}</Badge>
        <Badge>{project.year}</Badge>
      </div>
      <h3 className="font-display text-2xl font-semibold text-ink transition-colors group-hover:text-rig">
        {project.title}
      </h3>
      <p className="mt-3 text-sm text-core">{project.researcher}</p>
    </Link>
  );
}
