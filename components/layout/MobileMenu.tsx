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
      className={`fixed inset-0 z-[100] xl:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
      style={{ height: "100dvh" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      {/* Slide-in panel */}
      <div
        className={`absolute right-0 top-0 flex w-full max-w-sm flex-col bg-paper shadow-2xl transition-transform duration-300 ease-smooth ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ height: "100dvh" }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <span className="font-display text-lg font-semibold text-ink">Lab Perminyakan</span>
          <button
            aria-label="Tutup menu"
            className="-mr-2 p-2 text-ink transition-colors hover:text-rig"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
              className={`border-b border-line py-3.5 font-display text-lg text-ink transition-all duration-300 ${
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
                className="border-b border-line py-3.5 font-display text-lg text-ink"
              >
                Dashboard
              </Link>
              <a href="/api/auth/logout" className="py-3.5 font-display text-lg text-core">
                Keluar
              </a>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="mt-4 inline-flex justify-center bg-petrol py-3 font-display text-lg text-paper transition-colors hover:bg-petrol-light"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
