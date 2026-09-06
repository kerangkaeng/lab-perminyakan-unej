import Link from "next/link";
import { getSession } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
  roles: Array<"mahasiswa" | "admin" | "public">;
};

const navItems: NavItem[] = [
  { href: "/practicum/ajukan", label: "Ajukan Kegiatan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/status", label: "Status Pengajuan", roles: ["mahasiswa", "admin"] },
  { href: "/practicum/jadwal", label: "Jadwal", roles: ["public"] },
  { href: "/admin/practicum-requests", label: "Kelola Pengajuan", roles: ["admin"] },
  { href: "/admin/news", label: "Kelola Berita", roles: ["admin"] },
];

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
    <div className="container-lab py-12 grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:border-r lg:border-line lg:pr-6">
        <div className="mb-8">
          {session ? (
            <>
              <p className="font-display font-semibold text-ink">{session.nama}</p>
              <p className="text-xs font-mono text-core mt-1">{session.nim}</p>
              <p className="text-xs font-mono text-rig mt-1 uppercase">{session.appRole}</p>
            </>
          ) : (
            <p className="text-sm text-core">Belum login</p>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm py-2 px-3 -mx-3 text-ink/80 hover:bg-mist hover:text-rig transition-colors"
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

      <div>
        <p className="eyebrow mb-3">Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-display font-semibold mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
