import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { adminTables } from "@/lib/admin/config";

type NavItem = {
  href: string;
  label: string;
  roles: Array<"mahasiswa" | "admin" | "public">;
};

const staticNavItems: NavItem[] = [
  { href: "/practicum/ajukan", label: "Ajukan Kegiatan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/status", label: "Status Pengajuan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/jadwal", label: "Jadwal", roles: ["public"] },
  { href: "/admin/practicum-requests", label: "Kelola Pengajuan", roles: ["admin"] },
  { href: "/admin/news", label: "News", roles: ["admin"] },
];

const contentNavItems: NavItem[] = Object.entries(adminTables).map(([key, config]) => ({
  href: `/admin/${key}`,
  label: config.label,
  roles: ["admin"],
}));

const navItems: NavItem[] = [...staticNavItems, ...contentNavItems];

export async function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const session = await getSession();
  const visibleItems = navItems.filter(
    (item) => item.roles.includes("public") || (session && item.roles.includes(session.appRole))
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="lg:border-r lg:border-line lg:pr-6 lg:sticky lg:top-8 lg:self-start">
        <div className="mb-8">
          {session ? (
            <>
              <p className="font-display font-semibold text-ink">{session.nama}</p>
              <p className="text-xs font-mono text-core mt-1">{session.nim}</p>
              <p className="text-xs font-mono text-rig mt-1 uppercase">{session.userType}</p>
              {session.appRole === "admin" && (
                <p className="text-xs font-mono text-petrol mt-0.5 uppercase">Admin</p>
              )}
            </>
          ) : (
            <p className="text-sm text-core">Belum login</p>
          )}
        </div>
        <nav className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm py-2 px-3 -mx-3 text-ink/80 hover:bg-mist hover:text-rig transition-colors rounded"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 pt-6 border-t border-line">
          {session ? (
            <a href="/api/auth/logout" className="text-sm text-core hover:text-rig">
              Keluar
            </a>
          ) : (
            <Link href="/login" className="text-sm text-petrol hover:text-rig">
              Masuk
            </Link>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        <p className="eyebrow mb-3">Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-display font-semibold mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
