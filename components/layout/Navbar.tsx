"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/about", label: "About" },
  { href: "/facilities", label: "Facilities" },
  { href: "/research", label: "Research" },
  { href: "/publications", label: "Publications" },
  { href: "/practicum", label: "Practicum" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export type NavSession = { nama: string; appRole: "mahasiswa" | "admin" } | null;

export function Navbar({ session }: { session: NavSession }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line shadow-nav">
        <div className="container-lab flex h-16 items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-display text-lg font-semibold text-ink">Lab Perminyakan</span>
            <span className="hidden sm:inline eyebrow">Petroleum Eng.</span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6">
            {links.map((l) => {
              const active = pathname === l.href || pathname?.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative py-1 text-sm transition-colors ${
                    active ? "text-petrol font-medium" : "text-ink/80 hover:text-rig"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute -bottom-[21px] left-0 right-0 h-[2px] bg-rig transition-transform origin-left ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              );
            })}
            {session ? (
              <Link
                href="/practicum/status"
                className="text-sm font-medium text-paper bg-petrol hover:bg-petrol-light px-4 py-2 transition-colors"
              >
                {session.nama.split(" ")[0]}
              </Link>
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

      {/* Rendered as a SIBLING of <header>, not inside it — header's backdrop-blur
          would otherwise create a new containing block that traps this fixed overlay. */}
      <MobileMenu open={open} onClose={() => setOpen(false)} links={links} session={session} />
    </>
  );
}
