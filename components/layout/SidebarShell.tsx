"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const COOKIE_NAME = "sidebar_collapsed";

export function SidebarShell({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Simpan pilihan di cookie (bukan localStorage) supaya server component
    // GlobalDashboardSidebar bisa baca nilainya saat render awal — jadi
    // sidebar langsung terbuka/tertutup sesuai pilihan terakhir, tanpa
    // "kedip" dari expanded lalu tiba-tiba collapse setelah hydration.
    document.cookie = `${COOKIE_NAME}=${next ? "1" : "0"}; path=/; max-age=31536000`;
  }

  return (
    <aside
      className={`hidden lg:block shrink-0 border-r border-line transition-[width] duration-200 ease-smooth ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          aria-expanded={!collapsed}
          className="mb-4 flex h-8 w-8 shrink-0 items-center justify-center self-end rounded text-core transition-colors hover:bg-mist hover:text-rig"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={collapsed ? "hidden" : "block px-1"}>{children}</div>
      </div>
    </aside>
  );
}
