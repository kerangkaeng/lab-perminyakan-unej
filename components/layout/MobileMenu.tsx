"use client";

import Link from "next/link";
import { X } from "lucide-react";

type Link_ = { href: string; label: string };

export function MobileMenu({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: Link_[];
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
      </nav>
    </div>
  );
}
