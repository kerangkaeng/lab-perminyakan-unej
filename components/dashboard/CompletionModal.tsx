"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JenisKegiatan } from "@/types";
import { DOC_SLOTS_PRAKTIKUM, DOC_SLOTS_NON_PRAKTIKUM, INSIDEN_OPTIONS, SATUAN_ALAT, SATUAN_BAHAN } from "@/lib/constants/kegiatan";
import { supabasePublic } from "@/lib/supabase/authed";

type Props = {
  requestId: string;
  jenisKegiatan: JenisKegiatan;
  onClose: () => void;
};

type PinjamRow = { equipmentId: string; jumlah: string; satuan: string };
type EquipmentOption = { id: string; name: string };

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

  const [adaPeminjaman, setAdaPeminjaman] = useState<"ya" | "tidak" | "">("");
  const [pinjamAlat, setPinjamAlat] = useState<"ya" | "tidak" | "">("");
  const [pinjamBahan, setPinjamBahan] = useState<"ya" | "tidak" | "">("");
  const [alatList, setAlatList] = useState<PinjamRow[]>([{ equipmentId: "", jumlah: "", satuan: "" }]);
  const [bahanList, setBahanList] = useState<PinjamRow[]>([{ equipmentId: "", jumlah: "", satuan: "" }]);
  const [alatOptions, setAlatOptions] = useState<EquipmentOption[]>([]);
  const [bahanOptions, setBahanOptions] = useState<EquipmentOption[]>([]);

  useEffect(() => {
    async function loadEquipment() {
      const supabase = supabasePublic();
      const { data } = await supabase
        .from("equipment")
        .select("id, name, jenis")
        .eq("status", "published")
        .order("name", { ascending: true });

      const rows = (data as (EquipmentOption & { jenis: string | null })[]) ?? [];
      setAlatOptions(rows.filter((r) => r.jenis === "alat").map(({ id, name }) => ({ id, name })));
      setBahanOptions(rows.filter((r) => r.jenis === "bahan").map(({ id, name }) => ({ id, name })));
    }
    loadEquipment();
  }, []);

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

  function updateRow(list: PinjamRow[], setList: (v: PinjamRow[]) => void, index: number, patch: Partial<PinjamRow>) {
    setList(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow(list: PinjamRow[], setList: (v: PinjamRow[]) => void) {
    setList([...list, { equipmentId: "", jumlah: "", satuan: "" }]);
  }

  function removeRow(list: PinjamRow[], setList: (v: PinjamRow[]) => void, index: number) {
    if (list.length <= 1) {
      setList([{ equipmentId: "", jumlah: "", satuan: "" }]);
      return;
    }
    setList(list.filter((_, i) => i !== index));
  }

  function PinjamRowsEditor({
    list,
    setList,
    label,
    options,
    satuanOptions,
  }: {
    list: PinjamRow[];
    setList: (v: PinjamRow[]) => void;
    label: string;
    options: EquipmentOption[];
    satuanOptions: readonly string[];
  }) {
    if (options.length === 0) {
      return (
        <p className="text-xs text-core">
          Belum ada {label} yang terdaftar. Tambahkan dulu lewat menu Kelola Equipment (jenis: {label}).
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2 px-0.5">
          <span className="flex-1 min-w-0 font-mono text-[11px] uppercase tracking-wide text-core">
            {label === "alat" ? "Alat" : "Bahan"}
          </span>
          <span className="w-20 font-mono text-[11px] uppercase tracking-wide text-core">Jumlah</span>
          <span className="w-28 font-mono text-[11px] uppercase tracking-wide text-core">Satuan</span>
          <span className="w-7" />
        </div>
        {list.map((row, i) => (
          <div key={i} className="flex gap-2">
            <select
              value={row.equipmentId}
              onChange={(e) => updateRow(list, setList, i, { equipmentId: e.target.value })}
              className="flex-1 min-w-0 border border-line bg-mist px-3 py-2 text-sm"
            >
              <option value="">Pilih {label}</option>
              {options.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={row.jumlah}
              onChange={(e) => updateRow(list, setList, i, { jumlah: e.target.value })}
              placeholder="0"
              className="w-20 border border-line bg-mist px-2 py-2 text-sm"
            />
            <select
              value={row.satuan}
              onChange={(e) => updateRow(list, setList, i, { satuan: e.target.value })}
              className="w-28 border border-line bg-mist px-2 py-2 text-sm"
            >
              <option value="">Satuan</option>
              {satuanOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeRow(list, setList, i)}
              className="w-7 shrink-0 border border-line text-core hover:border-red-400 hover:text-red-700 transition-colors flex items-center justify-center"
              aria-label={`Hapus baris ${label}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addRow(list, setList)}
          className="flex items-center gap-1.5 text-xs text-petrol hover:text-rig transition-colors"
        >
          <Plus size={14} /> Tambah {label}
        </button>
      </div>
    );
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

    if (adaPeminjaman === "") {
      return setError("Mohon pilih apakah ada peminjaman alat/bahan.");
    }
    if (adaPeminjaman === "ya") {
      if (pinjamAlat === "" || pinjamBahan === "") {
        return setError("Mohon pilih Ya/Tidak untuk peminjaman alat dan bahan.");
      }
      if (pinjamAlat !== "ya" && pinjamBahan !== "ya") {
        return setError("Kalau ada peminjaman, pilih Ya untuk alat dan/atau bahan (minimal salah satu).");
      }
      if (pinjamAlat === "ya") {
        const incomplete = alatList.some(
          (r) => !r.equipmentId || !r.jumlah.trim() || Number(r.jumlah) <= 0 || !r.satuan
        );
        if (alatList.length === 0 || incomplete) {
          return setError("Mohon lengkapi pilihan alat, jumlah (angka > 0), dan satuannya.");
        }
      }
      if (pinjamBahan === "ya") {
        const incomplete = bahanList.some(
          (r) => !r.equipmentId || !r.jumlah.trim() || Number(r.jumlah) <= 0 || !r.satuan
        );
        if (bahanList.length === 0 || incomplete) {
          return setError("Mohon lengkapi pilihan bahan, jumlah (angka > 0), dan satuannya.");
        }
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

    payload.ada_peminjaman = adaPeminjaman === "ya";
    if (adaPeminjaman === "ya") {
      payload.pinjam_alat = pinjamAlat === "ya";
      payload.pinjam_bahan = pinjamBahan === "ya";
      payload.peminjaman_alat =
        pinjamAlat === "ya"
          ? alatList.map((r) => ({
              equipment_id: r.equipmentId,
              equipment_name: alatOptions.find((eq) => eq.id === r.equipmentId)?.name ?? "",
              jumlah: Number(r.jumlah),
              satuan: r.satuan,
            }))
          : undefined;
      payload.peminjaman_bahan =
        pinjamBahan === "ya"
          ? bahanList.map((r) => ({
              equipment_id: r.equipmentId,
              equipment_name: bahanOptions.find((eq) => eq.id === r.equipmentId)?.name ?? "",
              jumlah: Number(r.jumlah),
              satuan: r.satuan,
            }))
          : undefined;
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

          <div className="space-y-4 border-t border-line pt-6">
            <p className="font-mono text-xs uppercase tracking-wide text-core">Peminjaman Alat/Bahan</p>
            <div>
              <label className="mb-1.5 block text-sm text-ink">Apakah ada peminjaman alat/bahan?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdaPeminjaman("tidak")}
                  className={`border px-4 py-2.5 text-sm transition-colors ${
                    adaPeminjaman === "tidak" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                  }`}
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={() => setAdaPeminjaman("ya")}
                  className={`border px-4 py-2.5 text-sm transition-colors ${
                    adaPeminjaman === "ya" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                  }`}
                >
                  Ya
                </button>
              </div>
            </div>

            {adaPeminjaman === "ya" && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm text-ink">Pinjam Alat?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPinjamAlat("tidak")}
                      className={`border px-4 py-2.5 text-sm transition-colors ${
                        pinjamAlat === "tidak" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinjamAlat("ya")}
                      className={`border px-4 py-2.5 text-sm transition-colors ${
                        pinjamAlat === "ya" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                      }`}
                    >
                      Ya
                    </button>
                  </div>
                </div>

                {pinjamAlat === "ya" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-ink">Daftar Alat yang Dipinjam</label>
                    <PinjamRowsEditor
                      list={alatList}
                      setList={setAlatList}
                      label="alat"
                      options={alatOptions}
                      satuanOptions={SATUAN_ALAT}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm text-ink">Pinjam Bahan?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPinjamBahan("tidak")}
                      className={`border px-4 py-2.5 text-sm transition-colors ${
                        pinjamBahan === "tidak" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                      }`}
                    >
                      Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinjamBahan("ya")}
                      className={`border px-4 py-2.5 text-sm transition-colors ${
                        pinjamBahan === "ya" ? "border-petrol bg-mist text-ink" : "border-line text-core hover:border-petrol"
                      }`}
                    >
                      Ya
                    </button>
                  </div>
                </div>

                {pinjamBahan === "ya" && (
                  <div>
                    <label className="mb-1.5 block text-sm text-ink">Daftar Bahan yang Dipinjam</label>
                    <PinjamRowsEditor
                      list={bahanList}
                      setList={setBahanList}
                      label="bahan"
                      options={bahanOptions}
                      satuanOptions={SATUAN_BAHAN}
                    />
                  </div>
                )}
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
