"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";

/**
 * Sidebar dashboard: strip sempit (w-14) yang SELALU menempati ruang tetap
 * di layout (supaya konten utama tidak pernah ikut bergeser/mengecil).
 * Saat hover, panel penuh (w-64) muncul sebagai overlay `fixed` — lepas dari
 * document flow — jadi murni "mengambang" di atas konten, bukan mendorongnya.
 *
 * Ada juga fallback klik ("pinned") untuk pengguna keyboard/touch yang tidak
 * punya hover, supaya tetap accessible.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState(false);

  return (
    <aside className="hidden lg:block shrink-0 w-14 border-r border-line">
      <div className="group fixed left-0 top-16 bottom-0 z-40 w-14">
        {/* Strip sempit, selalu terlihat — sekaligus tombol fallback klik */}
        <button
          type="button"
          onClick={() => setPinned((v) => !v)}
          aria-expanded={pinned}
          aria-label={pinned ? "Tutup menu" : "Buka menu"}
          className="flex h-full w-14 flex-col items-center border-r border-line bg-paper pt-4 text-core transition-colors hover:text-rig"
        >
          <PanelLeftOpen size={18} />
        </button>

        {/* Panel penuh: overlay, tidak memengaruhi layout konten utama */}
        <div
          className={`absolute left-0 top-0 h-full w-64 overflow-y-auto overflow-x-hidden border-r border-line bg-paper p-3 shadow-2xl transition-opacity duration-150 ease-smooth
            ${pinned ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"}`}
        >
          {children}
        </div>
      </div>
    </aside>
  );
}
