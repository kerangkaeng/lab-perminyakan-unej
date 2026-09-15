import { getSession } from "@/lib/auth/session";
import { primaryNavItems, contentNavItems } from "@/lib/nav/dashboardNav";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SidebarShell } from "@/components/layout/SidebarShell";

export async function GlobalDashboardSidebar() {
  const session = await getSession();
  if (!session) return null;

  const visiblePrimary = primaryNavItems.filter((item) => item.roles.includes(session.appRole));
  const visibleContent =
    session.appRole === "admin" ? contentNavItems.filter((item) => item.roles.includes("admin")) : [];

  return (
    <SidebarShell>
      <div className="mb-6 min-w-0">
        <p className="break-words font-display font-semibold text-ink">{session.nama}</p>
        <p className="mt-1 break-words text-xs font-mono text-core">{session.nim ?? "—"}</p>
        <p className="mt-1 text-xs font-mono uppercase text-rig">{session.userType}</p>
        {session.appRole === "admin" && (
          <p className="mt-0.5 text-xs font-mono uppercase text-petrol">Admin</p>
        )}
      </div>

      <DashboardNav primaryItems={visiblePrimary} contentItems={visibleContent} />

      <div className="mt-6 border-t border-line pt-5">
        <a href="/api/auth/logout" className="text-sm text-core hover:text-rig">
          Keluar
        </a>
      </div>
    </SidebarShell>
  );
}
