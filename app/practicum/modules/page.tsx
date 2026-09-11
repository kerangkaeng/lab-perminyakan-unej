import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

interface ModuleRow {
  id: string;
  slug: string;
  title: string;
  facilities: { name: string } | null;
}

export default async function ModulesPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("practicum_modules")
    .select("id, slug, title, facilities ( name )")
    .eq("status", "published")
    .order("title", { ascending: true });

  const modules = (data ?? []) as unknown as ModuleRow[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Modul Praktikum</h1>

      {modules.length === 0 ? (
        <p className="text-core">Belum ada modul praktikum yang dipublikasikan.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/practicum/modules/${m.slug}`}
              className="border border-line p-5 hover:border-petrol transition-colors"
            >
              <p className="font-medium text-ink">{m.title}</p>
              <p className="text-xs text-core font-mono mt-1">{m.facilities?.name ?? "—"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
