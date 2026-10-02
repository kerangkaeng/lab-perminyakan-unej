"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const JENIS_OPTIONS = [
  { value: "all", label: "Semua Jenis" },
  { value: "praktikum", label: "Praktikum" },
  { value: "non_praktikum", label: "Non-Praktikum" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Baru Masuk (Belum Diaksi)" },
  { value: "acted", label: "Sudah Diaksi (Disetujui/Ditolak)" },
  { value: "admin_done", label: "Selesai Administrasi" },
  { value: "activity_pending", label: "Kegiatan Selesai, Administrasi Belum" },
];

const SORT_OPTIONS = [
  { value: "desc", label: "Tanggal Kegiatan: Terbaru Dulu" },
  { value: "asc", label: "Tanggal Kegiatan: Terlama Dulu" },
];

export function RequestsFilterBar({ labs }: { labs: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const jenis = searchParams.get("jenis") ?? "all";
  const lab = searchParams.get("lab") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const urutan = searchParams.get("urutan") ?? "desc";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "border border-line bg-mist px-3 py-2 text-sm text-ink focus:outline-none focus:border-petrol";

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <select
        value={jenis}
        onChange={(e) => updateParam("jenis", e.target.value)}
        className={selectClass}
        aria-label="Filter jenis kegiatan"
      >
        {JENIS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={lab}
        onChange={(e) => updateParam("lab", e.target.value)}
        className={selectClass}
        aria-label="Filter laboratorium"
      >
        <option value="all">Semua Laboratorium</option>
        {labs.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClass}
        aria-label="Filter status pengajuan"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={urutan}
        onChange={(e) => updateParam("urutan", e.target.value)}
        className={selectClass}
        aria-label="Urutan tanggal kegiatan"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {(jenis !== "all" || lab !== "all" || status !== "all" || urutan !== "desc") && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-xs text-core underline hover:text-rig px-1"
        >
          Reset Filter
        </button>
      )}
    </div>
  );
}
