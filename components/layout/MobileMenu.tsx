"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { NavSession } from "./Navbar";

type Link_ = { href: string; label: string };

export function MobileMenu({
  open,
  onClose,
  links,
  session,
}: {
  open: boolean;
  onClose: () => void;
  links: Link_[];
  session: NavSession;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper lg:hidden">
      <div className="container-lab flex h-16 items-center justify-between border-b border-line">
        <span className="font-display text-lg font-semibold">Lab Perminyakan</span>
        <button aria-label="Tutup menu" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      <nav className="container-lab flex flex-col py-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="py-3 border-b border-line text-lg font-display"
          >
            {l.label}
          </Link>
        ))}
        {session ? (
          <>
            <Link
              href="/practicum/status"
              onClick={onClose}
              className="py-3 border-b border-line text-lg font-display"
            >
              Dashboard
            </Link>
            <a href="/api/auth/logout" className="py-3 text-lg font-display text-core">
              Keluar
            </a>
          </>
        ) : (
          <Link href="/login" onClick={onClose} className="py-3 border-b border-line text-lg font-display">
            Masuk
          </Link>
        )}
      </nav>
    </div>
  );
}
