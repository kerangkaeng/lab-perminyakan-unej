import { supabasePublic } from "@/lib/supabase/authed";
import { CoverImage } from "@/components/ui/CoverImage";
import { Researcher } from "@/types";

export const revalidate = 0;

export default async function ResearchersPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("researchers")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });
  const researchers = (data ?? []) as Researcher[];

  return (
    <div className="container-lab section-space">
      <p className="eyebrow mb-4">Research</p>
      <h1 className="mb-16 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">Researchers</h1>
      <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {researchers.map((r) => (
          <div key={r.name}>
            <div className="relative mb-5 aspect-square overflow-hidden bg-mist">
              <CoverImage src={r.photo} seed={r.name} alt={r.name} className="object-cover" />
            </div>
            <p className="font-display text-lg font-semibold text-ink">{r.name}</p>
            <p className="text-sm text-core">{r.role}</p>
            <p className="mt-1 font-mono text-xs text-rig">{r.field}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
