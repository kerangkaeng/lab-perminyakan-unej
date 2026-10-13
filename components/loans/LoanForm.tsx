"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SATUAN_ALAT, SATUAN_BAHAN } from "@/lib/constants/kegiatan";

export type LoanEquipmentOption = {
  id: string;
  name: string;
  jenis: "alat" | "bahan";
  bidang: "pemboran_produksi" | "reservoir";
  /** true = alat umum (tidak dimiliki lab tertentu). */
  umum: boolean;
};

type Row = { equipmentId: string; jumlah: string; satuan: string };
const EMPTY_ROW: Row = { equipmentId: "", jumlah: "", satuan: "" };

const LAB_LABEL = { pemboran_produksi: "Pemboran & Produksi", reservoir: "Reservoir" } as const;

function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function LoanForm({
  options,
  hasSignature,
  defaultKontak = "",
}: {
  options: LoanEquipmentOption[];
  hasSignature: boolean;
  defaultKontak?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }]);
  const [keperluan, setKeperluan] = useState("");
  const [kontak, setKontak] = useState(defaultKontak);
  const [tanggalPinjam, setTanggalPinjam] = useState("");
  const [tanggalKembali, setTanggalKembali] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const groups = useMemo(() => {
    const g: { label: string; items: LoanEquipmentOption[] }[] = [
      { label: "Lab Reservoir", items: options.filter((o) => !o.umum && o.bidang === "reservoir") },
      { label: "Lab Pemboran & Produksi", items: options.filter((o) => !o.umum && o.bidang === "pemboran_produksi") },
      { label: "Alat Umum", items: options.filter((o) => o.umum) },
    ];
    return g.filter((x) => x.items.length > 0);
  }, [options]);

  // Lab yang terlibat -> menentukan Kepala Lab yang harus menandatangani.
  const involvedLabs = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const eq = byId.get(r.equipmentId);
      if (eq) set.add(eq.bidang);
    }
    return (["pemboran_produksi", "reservoir"] as const).filter((b) => set.has(b));
  }, [rows, byId]);

  const selectedIds = new Set(rows.map((r) => r.equipmentId).filter(Boolean));

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function pickEquipment(i: number, id: string) {
    const eq = byId.get(id);
    // Satuan lama bisa tidak berlaku untuk jenis baru (alat vs bahan) -> reset.
    const list: readonly string[] = eq ? (eq.jenis === "alat" ? SATUAN_ALAT : SATUAN_BAHAN) : [];
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const keepSatuan = list.includes(r.satuan);
        // Alat hanya bilangan bulat: buang desimal kalau berpindah dari bahan.
        const jumlah = eq?.jenis === "alat" ? r.jumlah.replace(/[.,].*$/, "") : r.jumlah;
        return { equipmentId: id, jumlah, satuan: keepSatuan ? r.satuan : "" };
      })
    );
  }
  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length <= 1 ? [{ ...EMPTY_ROW }] : prev.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit() {
    setError(null);
    setCreatedId(null);

    if (!hasSignature) return setError("Unggah tanda tangan kamu dulu di halaman Profil.");

    const filled = rows.filter((r) => r.equipmentId || r.jumlah || r.satuan);
    if (filled.length === 0) return setError("Mohon pilih minimal satu alat/bahan.");
    for (const r of filled) {
      if (!r.equipmentId || !r.jumlah.trim() || !(Number(r.jumlah) > 0) || !r.satuan) {
        return setError("Mohon lengkapi setiap baris: alat/bahan, jumlah (angka > 0), dan satuan.");
      }
    }
    if (keperluan.trim().length < 5) return setError("Mohon jelaskan keperluan peminjaman.");
    if (!kontak.trim()) return setError("Mohon isi nomor kontak yang bisa dihubungi.");
    if (!tanggalPinjam || !tanggalKembali) return setError("Mohon isi tanggal pinjam dan tanggal kembali.");
    if (tanggalKembali < tanggalPinjam) return setError("Tanggal kembali tidak boleh sebelum tanggal pinjam.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keperluan,
          kontak,
          tanggal_pinjam: tanggalPinjam,
          tanggal_kembali: tanggalKembali,
          items: filled.map((r) => ({
            equipment_id: r.equipmentId,
            jumlah: Number(r.jumlah),
            satuan: r.satuan,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Gagal membuat dokumen peminjaman.");
        return;
      }
      setCreatedId(body.id);
      // Buka PDF di tab baru; kalau diblokir browser, tautan manual ditampilkan di bawah.
      window.open(`/api/loans/${body.id}/pdf`, "_blank");
      setRows([{ ...EMPTY_ROW }]);
      setKeperluan("");
      setTanggalPinjam("");
      setTanggalKembali("");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full border border-line bg-mist px-3 py-2 text-sm";
  const labelCls = "mb-1 block font-mono text-[11px] uppercase tracking-wide text-core";

  if (options.length === 0) {
    return (
      <p className="max-w-xl border border-line bg-mist p-4 text-sm text-core">
        Belum ada alat/bahan yang tersedia untuk dipinjam. Silakan hubungi laboratorium.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {!hasSignature && (
        <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Kamu belum mengunggah tanda tangan. Dokumen peminjaman memakai tanda tangan dari Profil kamu.{" "}
          <Link href="/profile" className="font-medium underline">
            Unggah di Profil
          </Link>
          .
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">1. Alat &amp; bahan yang dipinjam</h2>
        <div className="space-y-2">
          <div className="hidden gap-2 px-0.5 sm:flex">
            <span className="min-w-0 flex-1 font-mono text-[11px] uppercase tracking-wide text-core">Alat / Bahan</span>
            <span className="w-20 font-mono text-[11px] uppercase tracking-wide text-core">Jumlah</span>
            <span className="w-28 font-mono text-[11px] uppercase tracking-wide text-core">Satuan</span>
            <span className="w-7" />
          </div>

          {rows.map((row, i) => {
            const eq = byId.get(row.equipmentId);
            const satuanOptions: readonly string[] = eq ? (eq.jenis === "alat" ? SATUAN_ALAT : SATUAN_BAHAN) : [];
            const isBahan = eq?.jenis === "bahan";
            return (
              <div key={i} className="flex flex-col gap-2 border border-line p-2 sm:flex-row sm:border-0 sm:p-0">
                <select
                  value={row.equipmentId}
                  onChange={(e) => pickEquipment(i, e.target.value)}
                  className="min-w-0 flex-1 border border-line bg-mist px-3 py-2 text-sm"
                >
                  <option value="">Pilih alat/bahan</option>
                  {groups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.items.map((o) => (
                        <option key={o.id} value={o.id} disabled={selectedIds.has(o.id) && o.id !== row.equipmentId}>
                          {o.name} ({o.jenis})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    // Bahan boleh desimal (mis. 0,5 Liter); alat hanya bilangan bulat.
                    inputMode={isBahan ? "decimal" : "numeric"}
                    autoComplete="off"
                    value={row.jumlah}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      const ok = isBahan ? /^\d*\.?\d*$/.test(v) : /^\d*$/.test(v);
                      if (ok) updateRow(i, { jumlah: v });
                    }}
                    placeholder="0"
                    aria-label="Jumlah"
                    className="w-20 border border-line bg-mist px-2 py-2 text-sm"
                  />
                  <select
                    value={row.satuan}
                    onChange={(e) => updateRow(i, { satuan: e.target.value })}
                    disabled={!eq}
                    aria-label="Satuan"
                    className="w-28 border border-line bg-mist px-2 py-2 text-sm disabled:opacity-60"
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
                    onClick={() => removeRow(i)}
                    className="flex w-7 shrink-0 items-center justify-center border border-line text-core transition-colors hover:border-red-400 hover:text-red-700"
                    aria-label="Hapus baris"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-petrol transition-colors hover:text-rig"
          >
            <Plus size={14} /> Tambah alat/bahan
          </button>
        </div>

        {involvedLabs.length > 0 && (
          <p className="mt-4 border-l-2 border-petrol bg-mist px-3 py-2 text-xs text-core">
            Dokumen akan ditandatangani Kepala Laboratorium{" "}
            <strong className="text-ink">{involvedLabs.map((b) => LAB_LABEL[b]).join(" dan ")}</strong>
            {involvedLabs.length > 1 ? " (kedua lab)" : ""}, beserta Laboran.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">2. Keperluan &amp; waktu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="keperluan">Keperluan peminjaman</label>
            <textarea
              id="keperluan"
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Contoh: pengujian rheologi lumpur untuk penelitian skripsi"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tgl-pinjam">Tanggal pinjam</label>
            <input
              id="tgl-pinjam"
              type="date"
              min={todayLocal()}
              value={tanggalPinjam}
              onChange={(e) => {
                setTanggalPinjam(e.target.value);
                if (tanggalKembali && e.target.value > tanggalKembali) setTanggalKembali(e.target.value);
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tgl-kembali">Tanggal kembali</label>
            <input
              id="tgl-kembali"
              type="date"
              min={tanggalPinjam || todayLocal()}
              value={tanggalKembali}
              onChange={(e) => setTanggalKembali(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="kontak">Nomor kontak (HP/WhatsApp)</label>
            <input
              id="kontak"
              type="tel"
              inputMode="tel"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              maxLength={20}
              placeholder="08xxxxxxxxxx"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {createdId && (
        <p className="border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Dokumen peminjaman dibuat. Kalau tab baru tidak terbuka,{" "}
          <a href={`/api/loans/${createdId}/pdf`} target="_blank" rel="noopener noreferrer" className="font-medium underline">
            buka PDF di sini
          </a>
          . Dokumen juga tersimpan di Riwayat di bawah.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-petrol px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-petrol-light disabled:opacity-50"
      >
        {submitting ? "Membuat dokumen…" : "Buat Dokumen Peminjaman (PDF)"}
      </button>
    </div>
  );
}
