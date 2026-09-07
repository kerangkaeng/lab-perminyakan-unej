"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface EquipmentRow {
  id: string;
  name: string;
  spec: string | null;
  function: string | null;
  image: string | null;
  sop_pdf_url: string | null;
}

export function EquipmentList({ equipment }: { equipment: EquipmentRow[] }) {
  const [selected, setSelected] = useState<EquipmentRow | null>(null);

  return (
    <>
      <div className="border-t border-line">
        {equipment.map((eq) => (
          <button
            key={eq.id}
            onClick={() => setSelected(eq)}
            className="group flex w-full items-center gap-5 border-b border-line py-4 text-left transition-colors hover:bg-mist"
          >
            <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-mist">
              {eq.image ? (
                <img
                  src={eq.image}
                  alt={eq.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink transition-colors group-hover:text-rig">
                {eq.name}
              </p>
              {eq.spec && <p className="truncate text-sm text-core">{eq.spec}</p>}
            </div>
            <span className="shrink-0 text-core transition-transform group-hover:translate-x-1">
              &#8594;
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ height: "100dvh" }}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSelected(null)} />

          <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden bg-paper shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
              <p className="font-display text-lg font-semibold text-ink">{selected.name}</p>
              <button
                aria-label="Tutup"
                onClick={() => setSelected(null)}
                className="-mr-2 p-2 text-ink transition-colors hover:text-rig"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selected.image && (
                <div className="relative aspect-[16/9] bg-mist">
                  <img src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="space-y-5 px-6 py-6">
                {selected.spec && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-core">Spesifikasi</p>
                    <p className="text-sm leading-relaxed text-ink">{selected.spec}</p>
                  </div>
                )}
                {selected.function && (
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-core">Fungsi</p>
                    <p className="text-sm leading-relaxed text-ink">{selected.function}</p>
                  </div>
                )}
                {selected.sop_pdf_url && (
                  <a
                    href={selected.sop_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-petrol px-4 py-2 text-sm text-petrol transition-colors hover:bg-petrol hover:text-paper"
                  >
                    Lihat SOP Penggunaan (PDF)
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
