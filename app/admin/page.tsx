import Link from "next/link";
import { adminTables } from "@/lib/admin/config";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const supabase = supabaseServer();
  const entries = Object.entries(adminTables);

  const counts = await Promise.all(
    entries.map(async ([key, config]) => {
      const { count } = await supabase.from(config.table).select("*", { count: "exact", head: true });
      return { key, label: config.label, count: count ?? 0 };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-8">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {counts.map((c) => (
          <Link key={c.key} href={`/admin/${c.key}`} className="border border-line p-5 hover:border-rig transition-colors">
            <p className="text-3xl font-display font-semibold text-ink">{c.count}</p>
            <p className="text-sm text-core mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
