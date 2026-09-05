"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JenisKegiatan } from "@/types";
import { DOC_SLOTS_PRAKTIKUM, DOC_SLOTS_NON_PRAKTIKUM, INSIDEN_OPTIONS } from "@/lib/constants/kegiatan";

type Props = {
  requestId: string;
  jenisKegiatan: JenisKegiatan;
  onClose: () => void;
};

export function CompletionModal({ requestId, jenisKegiatan, onClose }: Props) {
  const router = useRouter();
  const docSlots = jenisKegiatan === "praktikum" ? DOC_SLOTS_PRAKTIKUM : DOC_SLOTS_NON_PRAKTIKUM;

  const [uploaded, setUploaded] = useState<Record<string, string[]>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [adaInsiden, setAdaInsiden] = useState<"ya" | "tidak" | "">("");
  const [insidenJenis, setInsidenJenis] = useState("");
  const [insidenJenisLainnya, setInsidenJenisLainnya] = useState("");
  const [insidenNamaAlat, setInsidenNamaAlat] = useState("");
  const [insidenJumlah, setInsidenJumlah] = useState("");
  const [insidenPenyebab, setInsidenPenyebab] = useState("");
  const [insidenPihakTerkait, setInsidenPihakTerkait] = useState("");
  const [insidenTanggungJawab, setInsidenTanggungJawab] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(category: string, file: File) {
    setUploadingKey(category);
    setError(null);
    const form = new FormData();
    form.append("category", category);
    form.append("file", file);

    const res = await fetch(`/api/practicum/requests/${requestId}/documentation`, {
      method: "POST",
      body: form,
    });
    setUploadingKey(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal mengunggah berkas.");
      return;
    }
    setUploaded((prev) => ({ ...prev, [category]: [...(prev[category] ?? []), file.name] }));
  }

  async function handleSubmit() {
    setError(null);

    for (const slot of docSlots) {
      if (!uploaded[slot.key] || uploaded[slot.key].length === 0) {
        setError(`Mohon unggah ${slot.label.toLowerCase()} terlebih dahulu.`);
        return;
      }
    }
    if (adaInsiden === "") {
      setError("Mohon pilih apakah terjadi insiden selama kegiatan.");
      return;
    }
    if (adaInsiden === "ya") {
      if (!insidenJenis) return setError("Mohon pilih jenis insiden.");
      if (insidenJenis === "lainnya" && !insidenJenisLainnya) {
        return setError("Mohon jelaskan jenis insiden untuk kategori Lainnya.");
      }
      if (!insidenNamaAlat || !insidenJumlah || !insidenPenyebab || !insidenPihakTerkait || !insidenTanggungJawab) {
        return setError("Mohon lengkapi seluruh detail insiden.");
      }
      if (!uploaded["insiden_dokumentasi"] || uploaded["insiden_dokumentasi"].length === 0) {
        return setError("Mohon unggah dokumentasi insiden.");
      }
    }

    setSubmitting(true);
    const payload: Record<string, unknown> = { ada_insiden: adaInsiden === "ya" };
    if (adaInsiden === "ya") {
      payload.insiden_jenis = insidenJenis;
      payload.insiden_jenis_lainnya = insidenJenis === "lainnya" ? insidenJenisLainnya : undefined;
      payload.insiden_nama_alat = insidenNamaAlat;
      payload.insiden_jumlah = insidenJumlah;
      payload.insiden_penyebab = insidenPenyebab;
      payload.insiden_pihak_terkait = insidenPihakTerkait;
      payload.insiden_tanggung_jawab = insidenTanggungJawab;
    }

    const res = await fetch(`/api/practicum/requests/${requestId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menyelesaikan administrasi.");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden bg-paper shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
          <p className="font-display text-lg font-semibold text-ink">Lengkapi Administrasi</p>
          <button aria-label="Tutup" onClick={onClose} className="p-2 -mr-2 text-ink hover:text-rig transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {error && (
            <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{error}</p>
          )}

          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-wide text-core">Dokumentasi Kegiatan</p>
            {docSlots.map((slot) => (
              <div key={slot.key}>
                <label className="mb-1.5 block text-sm text-ink">{slot.label}</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  disabled={uploadingKey === slot.key}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(slot.key, file);
                    e.target.value = "";
                  }}
                  className="block w-full text-sm text-core file:mr-3 file:border file:border-line file:bg-mist file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-wide"
                />
                <p className="mt-1 text-xs text-core">
                  {uploadingKey === slot.key
                    ? "Mengunggah..."
                    : uploaded[slot.key]?.length
                    ? `${uploaded[slot.key].length} berkas terunggah`
                    : "Belum ada berkas"}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-line pt-6">
            <p className="font-mono text-xs uppercase tracking-wide text-core">Laporan Insiden</p>
            <div>
              <label className="mb-1.5 block text-sm text-ink">Apakah terjadi insiden selama kegiatan?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdaInsiden("tidak")}
                  className={`border px-4 py-2.5 text-sm transition-colors ${
                    adaInsiden === "tidak" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                  }`}
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={() => setAdaInsiden("ya")}
                  className={`border px-4 py-2.5 text-sm transition-colors ${
                    adaInsiden === "ya" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                  }`}
                >
                  Ya
                </button>
              </div>
            </div>

            {adaInsiden === "ya" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-ink">Jenis Insiden</label>
                  <select
                    value={insidenJenis}
                    onChange={(e) => setInsidenJenis(e.target.value)}
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  >
                    <option value="">Pilih jenis insiden</option>
                    {INSIDEN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {insidenJenis === "lainnya" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-ink">Jelaskan Jenis Insiden</label>
                    <input
                      value={insidenJenisLainnya}
                      onChange={(e) => setInsidenJenisLainnya(e.target.value)}
                      className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Nama Alat/Bahan</label>
                  <input
                    value={insidenNamaAlat}
                    onChange={(e) => setInsidenNamaAlat(e.target.value)}
                    placeholder="mis. Beaker Glass 500ml"
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Jumlah Alat/Bahan</label>
                  <input
                    value={insidenJumlah}
                    onChange={(e) => setInsidenJumlah(e.target.value)}
                    placeholder="mis. 2 buah, atau 500 ml"
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Penyebab Insiden</label>
                  <textarea
                    value={insidenPenyebab}
                    onChange={(e) => setInsidenPenyebab(e.target.value)}
                    rows={2}
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Pihak yang Terlibat (Nama dan NIM/NIP)</label>
                  <input
                    value={insidenPihakTerkait}
                    onChange={(e) => setInsidenPihakTerkait(e.target.value)}
                    placeholder="mis. Budi Santoso / 221910801000"
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Dokumentasi Insiden</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingKey === "insiden_dokumentasi"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload("insiden_dokumentasi", file);
                      e.target.value = "";
                    }}
                    className="block w-full text-sm text-core file:mr-3 file:border file:border-line file:bg-mist file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-wide"
                  />
                  <p className="mt-1 text-xs text-core">
                    {uploadingKey === "insiden_dokumentasi"
                      ? "Mengunggah..."
                      : uploaded["insiden_dokumentasi"]?.length
                      ? `${uploaded["insiden_dokumentasi"].length} berkas terunggah`
                      : "Belum ada berkas"}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Bentuk Ganti Rugi / Pertanggungjawaban</label>
                  <textarea
                    value={insidenTanggungJawab}
                    onChange={(e) => setInsidenTanggungJawab(e.target.value)}
                    rows={2}
                    className="w-full border border-line bg-mist px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-line px-6 py-4">
          <Button type="button" onClick={handleSubmit} className="w-full">
            {submitting ? "Menyimpan..." : "Selesaikan Administrasi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
