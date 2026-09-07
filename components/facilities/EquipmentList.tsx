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
      <div className="border border-line">
        {equipment.map((eq, i) => (
          <button
            key={eq.id}
            onClick={() => setSelected(eq)}
            className={`group flex w-full items-stretch gap-5 py-5 pl-2 pr-5 text-left transition-colors hover:bg-mist sm:pl-4 ${
              i !== 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="hidden w-8 shrink-0 self-center font-mono text-xs text-core/60 sm:block">
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="relative h-24 w-28 shrink-0 overflow-hidden bg-mist sm:h-28 sm:w-32">
              {eq.image ? (
                <img
                  src={eq.image}
                  alt={eq.name}
                  className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-mono text-[10px] uppercase text-core/50">Tanpa foto</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 self-center">
              <p className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-rig">
                {eq.name}
              </p>
              {eq.spec && (
                <p className="mt-1 line-clamp-1 text-sm text-core">{eq.spec}</p>
              )}
              {eq.function && (
                <p className="mt-0.5 line-clamp-1 text-sm text-core/70">{eq.function}</p>
              )}
              <span className="mt-2 inline-block text-xs font-medium text-petrol underline-offset-2 group-hover:underline">
                Lihat detail
              </span>
            </div>

            <span className="shrink-0 self-center text-lg text-core transition-transform group-hover:translate-x-1 group-hover:text-rig">
              &#8594;
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ height: "100dvh" }}>
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSelected(null)} />

          <div className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden bg-paper shadow-2xl">
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
              <div className="relative flex h-64 items-center justify-center bg-mist sm:h-80">
                {selected.image ? (
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="h-full w-full object-contain p-6"
                  />
                ) : (
                  <span className="font-mono text-xs uppercase text-core/50">Tanpa foto</span>
                )}
              </div>

              <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                {selected.spec && (
                  <div>
                    <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-rig">Spesifikasi</p>
                    <p className="text-sm leading-relaxed text-ink">{selected.spec}</p>
                  </div>
                )}
                {selected.function && (
                  <div>
                    <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-rig">Fungsi</p>
                    <p className="text-sm leading-relaxed text-ink">{selected.function}</p>
                  </div>
                )}
              </div>

              {selected.sop_pdf_url && (
                <div className="border-t border-line px-6 py-5">
                  <a
                    href={selected.sop_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block border border-petrol px-5 py-2.5 text-sm text-petrol transition-colors hover:bg-petrol hover:text-paper"
                  >
                    Lihat SOP Penggunaan (PDF)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
