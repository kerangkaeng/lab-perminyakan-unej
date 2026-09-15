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

  const sidebarContent = (
    <>
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
      <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm py-2 px-3 -mx-3 text-ink/80 hover:bg-mist hover:text-rig transition-colors rounded whitespace-nowrap"
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
    </>
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-12 lg:grid lg:gap-10 lg:grid-cols-[16px_1fr]">
      {/* Mobile & tablet (di bawah lg): nav tampil normal, hover tidak berlaku di perangkat sentuh */}
      <aside className="lg:hidden mb-10 border-b border-line pb-8">{sidebarContent}</aside>

      {/* Desktop (lg ke atas): strip tipis 16px, melebar jadi panel overlay saat di-hover */}
      <div className="hidden lg:block relative">
        <div className="group/sidebar sticky top-8">
          <div
            className="absolute left-0 top-0 z-30 h-[calc(100vh-5rem)] w-4 overflow-hidden
                       rounded-r bg-line/70 transition-all duration-300 ease-smooth
                       group-hover/sidebar:w-72 group-hover/sidebar:bg-paper
                       group-hover/sidebar:border group-hover/sidebar:border-line
                       group-hover/sidebar:shadow-2xl group-hover/sidebar:rounded-none"
          >
            <div
              className="hidden h-full w-72 flex-col p-6 opacity-0 transition-opacity duration-200
                         delay-100 group-hover/sidebar:flex group-hover/sidebar:opacity-100"
            >
              {sidebarContent}
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className="eyebrow mb-3">Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-display font-semibold mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
