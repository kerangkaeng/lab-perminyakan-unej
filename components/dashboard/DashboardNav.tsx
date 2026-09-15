"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";

export type NavItem = { href: string; label: string };

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={`block truncate rounded px-3 py-2 text-sm transition-colors ${
        active ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
      }`}
    >
      {item.label}
    </Link>
  );
}

/**
 * Trigger "Konten" — daftar 10+ tabel admin disembunyikan di accordion yang
 * meluas KE BAWAH di dalam sidebar (bukan flyout ke samping), supaya tidak
 * pernah keluar dari lebar sidebar (tidak ada scroll horizontal).
 */
function ContentAccordion({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAnyActive = items.some((i) => pathname === i.href || pathname?.startsWith(i.href + "/"));

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full min-w-0 items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
          isAnyActive ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <LayoutGrid size={15} className="shrink-0" />
          <span className="truncate">Konten</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Trik CSS grid-template-rows: animasi tinggi halus tanpa perlu ukur
          tinggi lewat JS, dan overflow-hidden mencegah isi meluber. */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-smooth ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="mt-1 ml-4 flex min-w-0 flex-col gap-0.5 border-l border-line pl-3">
            {items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block truncate rounded px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardNav({
  primaryItems,
  contentItems,
}: {
  primaryItems: NavItem[];
  contentItems: NavItem[];
}) {
  return (
    <nav className="flex w-full min-w-0 flex-col gap-1">
      {primaryItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
      {contentItems.length > 0 && <ContentAccordion items={contentItems} />}
    </nav>
  );
}
