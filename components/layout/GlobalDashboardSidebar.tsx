import { getSession } from "@/lib/auth/session";
import { primaryNavItems, contentNavItems } from "@/lib/nav/dashboardNav";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { Avatar } from "@/components/profile/Avatar";
import { supabaseServer } from "@/lib/supabase/server";
import { isProfilePhotoKey, profilePhotoUrl } from "@/lib/storage/b2";

export async function GlobalDashboardSidebar() {
  const session = await getSession();
  if (!session) return null;

  const visiblePrimary = primaryNavItems.filter((item) => item.roles.includes(session.appRole));
  const visibleContent = contentNavItems.filter((item) => item.roles.includes(session.appRole));

  // Foto profil (diunggah sendiri oleh user). Gagal query -> cukup tampil inisial.
  const { data: fotoRow } = await supabaseServer().from("users").select("foto").eq("id", session.usersId).maybeSingle();
  const foto = (fotoRow?.foto as string | null) ?? null;
  const fotoUrl = isProfilePhotoKey(foto, session.usersId) ? profilePhotoUrl(foto) : null;

  return (
    <SidebarShell>
      <div className="mb-6 flex min-w-0 items-center gap-3">
        <Avatar src={fotoUrl} name={session.nama} size={48} />
        <div className="min-w-0">
          <p className="break-words font-display font-semibold text-ink">{session.nama}</p>
          <p className="mt-1 break-words text-xs font-mono text-core">{session.nim ?? "—"}</p>
          <p className="mt-1 text-xs font-mono uppercase text-rig">{session.userType}</p>
          {session.appRole === "admin" && (
            <p className="mt-0.5 text-xs font-mono uppercase text-petrol">Admin</p>
          )}
          {session.appRole === "asisten" && (
            <p className="mt-0.5 text-xs font-mono uppercase text-petrol">Asisten</p>
          )}
        </div>
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
