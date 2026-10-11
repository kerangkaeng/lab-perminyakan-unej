"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type NavItem = { href: string; label: string };
export type NavSectionData = { key: string; title: string; items: NavItem[] };

function isActive(pathname: string | null, href: string) {
  return pathname === href || !!pathname?.startsWith(href + "/");
}

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`block break-words rounded px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
      }`}
    >
      {item.label}
    </Link>
  );
}

/**
 * Satu kelompok = satu akordeon. Terbuka otomatis kalau salah satu itemnya
 * sedang aktif; selain itu tertutup. Meluas KE BAWAH di dalam sidebar
 * (bukan flyout ke samping) supaya tidak pernah melebihi lebar sidebar.
 */
function AccordionSection({ section }: { section: NavSectionData }) {
  const pathname = usePathname();
  const anyActive = section.items.some((i) => isActive(pathname, i.href));
  const [open, setOpen] = useState(anyActive);

  return (
    <div className="w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full min-w-0 items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
          anyActive ? "bg-mist font-medium text-petrol" : "text-ink/80 hover:bg-mist hover:text-rig"
        }`}
      >
        <span className="break-words">{section.title}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Trik CSS grid-template-rows: animasi tinggi halus tanpa ukur lewat
          JS; overflow-hidden mencegah isi meluber. */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-smooth ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="mt-1 ml-4 flex min-w-0 flex-col gap-0.5 border-l border-line pl-3">
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardNav({ sections }: { sections: NavSectionData[] }) {
  return (
    <nav aria-label="Menu dashboard" className="flex w-full min-w-0 flex-col gap-1">
      {sections.map((section) => (
        <AccordionSection key={section.key} section={section} />
      ))}
    </nav>
  );
}
