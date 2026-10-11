"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";

/**
 * Sidebar dashboard — dua tampilan menurut lebar layar:
 *
 *  - xl (>=1280px): panel PENUH (w-64) yang selalu terlihat dan menempati
 *    ruang tetap di layout, jadi menu langsung terbaca tanpa hover.
 *  - lg (1024–1279px): strip sempit (w-14); saat hover/klik, panel penuh
 *    (w-72) muncul sebagai overlay `fixed` di atas konten (tidak mendorong
 *    konten). Klik = fallback untuk keyboard/touch.
 *  - di bawah lg: disembunyikan; menu ada di MobileMenu.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState(false);

  return (
    <>
      {/* xl: panel penuh, selalu terlihat */}
      <aside className="hidden xl:block shrink-0 w-64 border-r border-line">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden bg-paper p-4">
          {children}
        </div>
      </aside>

      {/* lg: strip + overlay */}
      <aside className="hidden lg:block xl:hidden shrink-0 w-14 border-r border-line">
        <div className="group fixed left-0 top-16 bottom-0 z-40 w-14">
          <button
            type="button"
            onClick={() => setPinned((v) => !v)}
            aria-expanded={pinned}
            aria-label={pinned ? "Tutup menu" : "Buka menu"}
            className="flex h-full w-14 flex-col items-center border-r border-line bg-paper pt-4 text-core transition-colors hover:text-rig"
          >
            <PanelLeftOpen size={18} />
          </button>

          <div
            className={`absolute left-0 top-0 h-full w-72 overflow-y-auto overflow-x-hidden border-r border-line bg-paper p-4 shadow-2xl transition-opacity duration-150 ease-smooth
              ${pinned ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"}`}
          >
            {children}
          </div>
        </div>
      </aside>
    </>
  );
}
