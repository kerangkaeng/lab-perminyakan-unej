"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type NavItem = { href: string; label: string };
export type NavSectionData = { key: string; title: string; items: NavItem[]; collapsible?: boolean };

function isActive(pathname: string | null, href: string) {
  return pathname === href || !!pathname?.startsWith(href + "/");
}

function NavLink({ item, small = false }: { item: NavItem; small?: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`block break-words rounded px-3 text-sm transition-colors ${small ? "py-1.5" : "py-2"} ${
        active ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
      }`}
    >
      {item.label}
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 font-mono text-[11px] uppercase tracking-wider text-core">{children}</p>;
}

/**
 * Kelompok yang bisa dilipat ("Konten Situs": berita + 10+ tabel). Terbuka
 * otomatis kalau salah satu itemnya sedang aktif. Meluas KE BAWAH di dalam
 * sidebar (bukan flyout) supaya tidak pernah melebihi lebar sidebar.
 */
function CollapsibleSection({ section }: { section: NavSectionData }) {
  const pathname = usePathname();
  const anyActive = section.items.some((i) => isActive(pathname, i.href));
  const [open, setOpen] = useState(anyActive);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 pb-1 font-mono text-[11px] uppercase tracking-wider text-core transition-colors hover:text-rig"
      >
        <span>{section.title}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-smooth ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="flex min-w-0 flex-col gap-0.5">
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} small />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardNav({ sections }: { sections: NavSectionData[] }) {
  return (
    <nav aria-label="Menu dashboard" className="flex w-full min-w-0 flex-col gap-5">
      {sections.map((section) =>
        section.collapsible ? (
          <CollapsibleSection key={section.key} section={section} />
        ) : (
          <div key={section.key} className="min-w-0">
            <SectionTitle>{section.title}</SectionTitle>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )
      )}
    </nav>
  );
}
