import Link from "next/link";
import { adminTables } from "@/lib/admin/config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-lab py-12 flex gap-10">
      <aside className="w-56 shrink-0">
        <p className="eyebrow mb-4">Admin Panel</p>
        <nav className="flex flex-col gap-1">
          <Link href="/admin" className="text-sm px-3 py-2 hover:bg-mist rounded">
            Dashboard
          </Link>
          {Object.entries(adminTables).map(([key, config]) => (
            <Link key={key} href={`/admin/${key}`} className="text-sm px-3 py-2 hover:bg-mist rounded">
              {config.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
