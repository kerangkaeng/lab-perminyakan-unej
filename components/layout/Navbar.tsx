"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { mainNav, activeLeaf, isEntryActive, type NavEntry } from "@/lib/nav/mainNav";

export type NavSession = { nama: string; appRole: "mahasiswa" | "admin" | "asisten" | "dosen" } | null;

function DesktopEntry({ entry, pathname }: { entry: NavEntry; pathname: string | null }) {
  const active = isEntryActive(entry, pathname);
  const leaf = activeLeaf(entry, pathname);
  const hasItems = !!entry.items?.length;

  const triggerClass = entry.highlight
    ? `inline-flex items-center gap-1 whitespace-nowrap border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-petrol bg-petrol text-paper" : "border-petrol text-petrol hover:bg-petrol hover:text-paper"
      }`
    : `relative inline-flex items-center gap-1 whitespace-nowrap py-1 text-sm transition-colors ${
        active ? "font-medium text-petrol" : "text-ink/80 hover:text-rig"
      }`;

  return (
    <div className="group relative">
      {entry.href && !hasItems ? (
        <Link href={entry.href} className={triggerClass}>
          {entry.label}
          {!entry.highlight && (
            <span
              className={`absolute -bottom-[21px] left-0 right-0 h-[2px] bg-rig transition-transform origin-left ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          )}
        </Link>
      ) : (
        // Grup dengan sub-menu: label hanya MEMBUKA menu (hover/fokus/ketuk),
        // tidak berpindah halaman — supaya klik pada grup tidak membingungkan.
        <button type="button" className={triggerClass} aria-haspopup="true">
          {entry.label}
          <ChevronDown size={14} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
          {!entry.highlight && (
            <span
              className={`absolute -bottom-[21px] left-0 right-0 h-[2px] bg-rig transition-transform origin-left ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          )}
        </button>
      )}

      {hasItems && (
        // pt-3 = jembatan hover agar menu tidak menutup saat kursor turun.
        <div className="invisible absolute left-0 top-full z-50 min-w-[14rem] pt-3 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          <ul className="border border-line bg-paper py-1.5 shadow-card-hover">
            {entry.items!.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2 text-sm transition-colors hover:bg-mist hover:text-rig ${
                    leaf?.href === item.href ? "bg-mist font-medium text-petrol" : "text-ink/80"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Navbar({ session }: { session: NavSession }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line shadow-nav">
        <div className="container-lab flex h-16 items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 shrink-0 whitespace-nowrap">
            <span className="font-display text-lg font-semibold text-ink">Lab Perminyakan</span>
            <span className="hidden 2xl:inline eyebrow">Petroleum Eng.</span>
          </Link>
          <nav className="hidden xl:flex items-center gap-5 2xl:gap-7">
            {mainNav.map((entry) => (
              <DesktopEntry key={entry.label} entry={entry} pathname={pathname} />
            ))}
            {session ? (
              <div className="flex shrink-0 items-center gap-3 border-l border-line pl-4">
                {(session.appRole === "admin" || session.appRole === "asisten") && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-petrol hover:text-rig transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="whitespace-nowrap text-sm font-medium text-paper bg-petrol hover:bg-petrol-light px-4 py-2 transition-colors"
                >
                  {session.nama.split(" ")[0]}
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-paper bg-petrol hover:bg-petrol-light px-4 py-2 transition-colors"
              >
                Masuk
              </Link>
            )}
          </nav>
          <button
            aria-label="Buka menu"
            className="xl:hidden -mr-2 p-2 text-ink hover:text-rig transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} session={session} />
    </>
  );
}
