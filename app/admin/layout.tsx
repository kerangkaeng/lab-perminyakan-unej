import Link from "next/link";
import { adminTables } from "@/lib/admin/config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line px-6 py-4">
        <p className="font-mono text-xs uppercase text-core">Lab Perminyakan UNEJ — Admin Panel</p>
      </div>
      <div className="flex">
        <aside className="w-64 shrink-0 border-r border-line min-h-[calc(100vh-57px)] sticky top-0 px-4 py-6">
          <nav className="flex flex-col gap-1">
            <Link href="/admin" className="text-sm px-3 py-2 rounded hover:bg-mist font-medium">
              Dashboard
            </Link>
            <div className="my-2 border-t border-line" />
            {Object.entries(adminTables).map(([key, config]) => (
              <Link key={key} href={`/admin/${key}`} className="text-sm px-3 py-2 rounded hover:bg-mist">
                {config.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0 px-8 py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
