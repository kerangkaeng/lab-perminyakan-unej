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
  // true kalau administrasi ini sebelumnya sudah pernah diselesaikan dan
  // sedang dibuka kembali untuk direvisi (lihat CompletionButton) — dipakai
  // untuk memicu prefill dan mengubah label di UI.
  isRevision?: boolean;
};

type PinjamRow = { equipmentId: string; jumlah: string; satuan: string };
type EquipmentOption = { id: string; name: string };

// Bentuk `requestData` yang dikembalikan endpoint GET
// /api/practicum/requests/[id]/documentation — dipakai untuk prefill.
type RequestDataForPrefill = {
  ada_insiden: boolean;
  insiden_jenis: string | null;
  insiden_jenis_lainnya: string | null;
  insiden_nama_alat: string | null;
  insiden_jumlah: string | null;
  insiden_penyebab: string | null;
  insiden_pihak_terkait: string | null;
  insiden_tanggung_jawab: string | null;
  ada_peminjaman: boolean;
  pinjam_alat: boolean | null;
  pinjam_bahan: boolean | null;
  peminjaman_alat: { equipment_id: string; equipment_name?: string; jumlah: number; satuan: string }[] | null;
  peminjaman_bahan: { equipment_id: string; equipment_name?: string; jumlah: number; satuan: string }[] | null;
};

const EMPTY_ROW: PinjamRow = { equipmentId: "", jumlah: "", satuan: "" };

function toPinjamRows(items: RequestDataForPrefill["peminjaman_alat"]): PinjamRow[] {
  if (!items || items.length === 0) return [{ ...EMPTY_ROW }];
  return items.map((item) => ({
    equipmentId: item.equipment_id ?? "",
    jumlah: item.jumlah != null ? String(item.jumlah) : "",
    satuan: item.satuan ?? "",
  }));
}

export function CompletionModal({ requestId, jenisKegiatan, onClose, isRevision = false }: Props) {
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
  const [alatList, setAlatList] = useState<PinjamRow[]>([{ ...EMPTY_ROW }]);
  const [bahanList, setBahanList] = useState<PinjamRow[]>([{ ...EMPTY_ROW }]);
  const [alatOptions, setAlatOptions] = useState<EquipmentOption[]>([]);
  const [bahanOptions, setBahanOptions] = useState<EquipmentOption[]>([]);

  const [prefillLoading, setPrefillLoading] = useState(isRevision);
  const [prefillError, setPrefillError] = useState<string | null>(null);

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

  // Prefill: hanya jalan kalau ini revisi (bukan pengisian pertama kali).
  // Ambil data lama (insiden, peminjaman, daftar berkas yang sudah
  // terunggah) dari endpoint documentation, lalu isi semua state form
  // dengan data itu supaya pengaju tinggal koreksi bagian yang salah,
  // bukan mengisi ulang dari nol.
  useEffect(() => {
    if (!isRevision) return;
    let active = true;

    (async () => {
      const res = await fetch(`/api/practicum/requests/${requestId}/documentation`);
      if (!active) return;

      if (!res.ok) {
        setPrefillError("Gagal memuat data sebelumnya. Kamu tetap bisa mengisi ulang dari awal.");
        setPrefillLoading(false);
        return;
      }

      const body = await res.json();
      const rd = body.requestData as RequestDataForPrefill | undefined;
      const signed = (body.data ?? {}) as Record<string, { path: string; url: string }[]>;

      // Tandai berkas yang sudah ada sebagai "sudah terunggah" (pakai path
      // sebagai identifier, bukan nama file asli — cukup untuk validasi
      // & tampilan jumlah berkas). Upload baru tetap ditambahkan di atas
      // ini (lihat handleUpload), bukan menggantikannya.
      const uploadedFromSigned: Record<string, string[]> = {};
      for (const [key, files] of Object.entries(signed)) {
        if (files.length > 0) uploadedFromSigned[key] = files.map((f) => f.path);
      }
      setUploaded(uploadedFromSigned);

      if (rd) {
        setAdaInsiden(rd.ada_insiden ? "ya" : "tidak");
        setInsidenJenis(rd.insiden_jenis ?? "");
        setInsidenJenisLainnya(rd.insiden_jenis_lainnya ?? "");
        setInsidenNamaAlat(rd.insiden_nama_alat ?? "");
        setInsidenJumlah(rd.insiden_jumlah ?? "");
        setInsidenPenyebab(rd.insiden_penyebab ?? "");
        setInsidenPihakTerkait(rd.insiden_pihak_terkait ?? "");
        setInsidenTanggungJawab(rd.insiden_tanggung_jawab ?? "");

        setAdaPeminjaman(rd.ada_peminjaman ? "ya" : "tidak");
        setPinjamAlat(rd.pinjam_alat === true ? "ya" : rd.pinjam_alat === false ? "tidak" : "");
        setPinjamBahan(rd.pinjam_bahan === true ? "ya" : rd.pinjam_bahan === false ? "tidak" : "");
        setAlatList(toPinjamRows(rd.peminjaman_alat));
        setBahanList(toPinjamRows(rd.peminjaman_bahan));
      }

      setPrefillLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [isRevision, requestId]);

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
    setList([...list, { ...EMPTY_ROW }]);
  }

  function removeRow(list: PinjamRow[], setList: (v: PinjamRow[]) => void, index: number) {
    if (list.length <= 1) {
      setList([{ ...EMPTY_ROW }]);
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

    // Komponen `Button` di proyek ini tidak punya prop `disabled`, jadi
    // pencegahan submit selagi data lama masih dimuat (prefill) dilakukan
    // di sini, bukan lewat atribut disabled di tombolnya.
    if (prefillLoading) return;

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
          <p className="font-display text-lg font-semibold text-ink">
            {isRevision ? "Revisi Administrasi" : "Lengkapi Administrasi"}
          </p>
          <button aria-label="Tutup" onClick={onClose} className="p-2 -mr-2 text-ink hover:text-rig transition-colors">
            <X size={20} />
          </button>
        </div>

        {prefillLoading ? (
          <div className="flex-1 flex items-center justify-center px-6 py-6">
            <p className="text-sm text-core">Memuat data sebelumnya...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {isRevision && (
              <p className="text-xs text-rig border border-rig/40 bg-rig/5 px-4 py-3">
                Form ini sudah diisi dengan data yang kamu kirim sebelumnya. Ubah bagian yang salah lalu simpan
                ulang.
              </p>
            )}
            {prefillError && (
              <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{prefillError}</p>
            )}
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
        )}

        <div className="shrink-0 border-t border-line px-6 py-4">
          <Button
            type="button"
            onClick={handleSubmit}
            className={`w-full ${prefillLoading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {submitting ? "Menyimpan..." : isRevision ? "Simpan Revisi" : "Selesaikan Administrasi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
