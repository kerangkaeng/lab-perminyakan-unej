import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
    <DashboardShell title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {counts.map((c) => (
          <Link key={c.key} href={`/admin/${c.key}`} className="border border-line p-5 hover:border-rig transition-colors">
            <p className="text-3xl font-display font-semibold text-ink">{c.count}</p>
            <p className="text-sm text-core mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
