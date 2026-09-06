import { supabasePublic } from "@/lib/supabase/authed";
import { PublicationTable } from "@/components/publications/PublicationTable";
import { Publication } from "@/types";

export const revalidate = 0;

export default async function PublicationsPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("publications")
    .select("*")
    .eq("status", "published")
    .order("year", { ascending: false });
  const publications = (data ?? []) as Publication[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Publications</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Publikasi</h1>
      <PublicationTable publications={publications} />
    </div>
  );
}
