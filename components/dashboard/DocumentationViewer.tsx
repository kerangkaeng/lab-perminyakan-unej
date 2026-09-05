"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PracticumRequest } from "@/types";
import { DOC_SLOTS_PRAKTIKUM, DOC_SLOTS_NON_PRAKTIKUM, insidenLabel } from "@/lib/constants/kegiatan";

type SignedFile = { path: string; url: string };

export function DocumentationViewer({ request, onClose }: { request: PracticumRequest; onClose: () => void }) {
  const [signed, setSigned] = useState<Record<string, SignedFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docSlots = request.jenis_kegiatan === "praktikum" ? DOC_SLOTS_PRAKTIKUM : DOC_SLOTS_NON_PRAKTIKUM;

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch(`/api/practicum/requests/${request.id}/documentation`);
      if (!active) return;
      if (!res.ok) {
        setError("Gagal memuat dokumentasi.");
        setLoading(false);
        return;
      }
      const body = await res.json();
      setSigned(body.data ?? {});
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [request.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden bg-paper shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
          <p className="font-display text-lg font-semibold text-ink">Dokumentasi & Insiden</p>
          <button aria-label="Tutup" onClick={onClose} className="p-2 -mr-2 text-ink hover:text-rig transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {loading && <p className="text-sm text-core">Memuat...</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          {!loading && !error && (
            <>
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-wide text-core">Dokumentasi Kegiatan</p>
                {docSlots.map((slot) => (
                  <div key={slot.key}>
                    <p className="text-sm font-medium text-ink mb-1">{slot.label}</p>
                    {signed[slot.key]?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {signed[slot.key].map((f) => (
                          
                            key={f.path}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-petrol underline hover:text-rig"
                          >
                            Lihat berkas
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-core">Belum ada berkas</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-line pt-6">
                <p className="font-mono text-xs uppercase tracking-wide text-core mb-3">Laporan Insiden</p>
                {!request.ada_insiden ? (
                  <p className="text-sm text-core">Tidak ada insiden selama kegiatan.</p>
                ) : (
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-core uppercase">Jenis Insiden</dt>
                      <dd className="text-ink">
                        {request.insiden_jenis === "lainnya"
                          ? request.insiden_jenis_lainnya
                          : insidenLabel(request.insiden_jenis)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase">Nama Alat/Bahan</dt>
                      <dd className="text-ink">{request.insiden_nama_alat}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase">Jumlah</dt>
                      <dd className="text-ink">{request.insiden_jumlah}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase">Penyebab</dt>
                      <dd className="text-ink">{request.insiden_penyebab}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase">Pihak yang Terlibat</dt>
                      <dd className="text-ink">{request.insiden_pihak_terkait}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase">Bentuk Ganti Rugi</dt>
                      <dd className="text-ink">{request.insiden_tanggung_jawab}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-core uppercase mb-1">Dokumentasi Insiden</dt>
                      <dd className="flex flex-wrap gap-2">
                        {signed["insiden_dokumentasi"]?.length ? (
                          signed["insiden_dokumentasi"].map((f) => (
                            
                              key={f.path}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-petrol underline hover:text-rig"
                            >
                              Lihat berkas
                            </a>
                          ))
                        ) : (
                          <span className="text-xs text-core">Belum ada berkas</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
