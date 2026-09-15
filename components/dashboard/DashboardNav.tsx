"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronRight, LayoutGrid } from "lucide-react";

export type NavItem = { href: string; label: string };

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={`rounded px-3 py-2 text-sm transition-colors ${
        active ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
      }`}
    >
      {item.label}
    </Link>
  );
}

/**
 * Trigger "Konten" — daftar 10+ tabel admin disembunyikan di panel flyout
 * supaya sidebar utama tidak sesak. Dibuka via hover (desktop, mouse) DAN
 * klik/focus (keyboard, touch) — bukan hover-only, supaya tetap accessible.
 */
function ContentFlyout({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAnyActive = items.some((i) => pathname === i.href || pathname?.startsWith(i.href + "/"));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="group/flyout relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
          isAnyActive ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
        }`}
      >
        <span className="flex items-center gap-2">
          <LayoutGrid size={15} />
          Konten
        </span>
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      <div
        className={`absolute left-0 top-full z-40 mt-1 w-64 origin-top rounded border border-line bg-paper p-2 shadow-2xl transition-all duration-150 ease-smooth
          lg:left-full lg:top-0 lg:ml-2 lg:mt-0 lg:origin-left
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
      >
        <div className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded px-3 py-2 text-sm transition-colors ${
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
    <nav className="flex flex-col gap-1">
      {primaryItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
      {contentItems.length > 0 && <ContentFlyout items={contentItems} />}
    </nav>
  );
}
