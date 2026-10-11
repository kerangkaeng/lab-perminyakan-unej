"use client";
import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { NavSession } from "./Navbar";
import { mainNav } from "@/lib/nav/mainNav";
import { dashboardSectionsFor } from "@/lib/nav/dashboardNav";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 mb-1 font-mono text-[11px] uppercase tracking-wider text-core">{children}</p>;
}

export function MobileMenu({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: NavSession;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sections = session ? dashboardSectionsFor(session.appRole) : [];

  return (
    <div
      className={`fixed inset-0 z-[100] xl:hidden transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
      style={{ height: "100dvh" }}
    >
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
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

        <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {/* Menu situs, dikelompokkan seperti navbar desktop */}
          {mainNav.map((entry) => (
            <div key={entry.href} className="border-b border-line py-3">
              {entry.items?.length ? (
                <>
                  <p className={`font-display text-lg ${entry.highlight ? "text-petrol" : "text-ink"}`}>{entry.label}</p>
                  <div className="mt-1 flex flex-col">
                    {entry.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="py-2 pl-3 text-base text-ink/80 transition-colors hover:text-rig"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link href={entry.href} onClick={onClose} className="block font-display text-lg text-ink">
                  {entry.label}
                </Link>
              )}
            </div>
          ))}

          {session ? (
            <>
              {sections.map((section) => (
                <div key={section.key}>
                  <SectionHeading>{section.title}</SectionHeading>
                  <div className="flex flex-col">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="border-b border-line py-2.5 text-base text-ink"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <SectionHeading>Akun</SectionHeading>
              <Link href="/profile" onClick={onClose} className="border-b border-line py-2.5 text-base text-rig">
                Profil
              </Link>
              <a href="/api/auth/logout" className="py-2.5 text-base text-core">
                Keluar
              </a>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="mt-6 inline-flex justify-center bg-petrol py-3 font-display text-lg text-paper transition-colors hover:bg-petrol-light"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
