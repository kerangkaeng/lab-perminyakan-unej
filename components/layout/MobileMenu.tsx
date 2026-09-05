"use client";

import Link from "next/link";
import { useEffect } from "react";
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
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`absolute inset-y-0 right-0 w-full max-w-sm bg-paper shadow-2xl transition-transform duration-300 ease-smooth ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="container-lab flex h-16 items-center justify-between border-b border-line">
          <span className="font-display text-lg font-semibold">Lab Perminyakan</span>
          <button
            aria-label="Tutup menu"
            className="p-2 -mr-2 text-ink hover:text-rig transition-colors"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <nav className="container-lab flex flex-col py-6 overflow-y-auto h-[calc(100%-4rem)]">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
              className={`py-3.5 border-b border-line text-lg font-display transition-all duration-300 ${
                open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link
                href="/practicum/status"
                onClick={onClose}
                className="py-3.5 border-b border-line text-lg font-display"
              >
                Dashboard
              </Link>
              <a href="/api/auth/logout" className="py-3.5 text-lg font-display text-core">
                Keluar
              </a>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="mt-4 inline-flex justify-center bg-petrol text-paper py-3 text-lg font-display hover:bg-petrol-light transition-colors"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
