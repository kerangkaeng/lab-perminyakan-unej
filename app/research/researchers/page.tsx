import { researchers } from "@/data/research";

export default function ResearchersPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Research</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Researchers</h1>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {researchers.map((r) => (
          <div key={r.name} className="border border-line p-6">
            <p className="font-display font-semibold text-ink">{r.name}</p>
            <p className="text-sm text-core">{r.role}</p>
            <p className="text-xs text-rig font-mono mt-1">{r.field}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
