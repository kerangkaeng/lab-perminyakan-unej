"use client";

import Link from "next/link";
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

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="container-lab flex h-16 items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-ink">Lab Perminyakan</span>
          <span className="hidden sm:inline eyebrow">Petroleum Eng.</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ink/80 hover:text-rig transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <Link href="/practicum/status" className="text-sm text-petrol hover:text-rig">
              {session.nama.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-petrol hover:text-rig">
              Masuk
            </Link>
          )}
        </nav>

        <button aria-label="Buka menu" className="lg:hidden text-ink" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} links={links} session={session} />
    </header>
  );
}
