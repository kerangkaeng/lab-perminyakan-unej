export const NON_PRAKTIKUM_OPTIONS = [
  { value: "penelitian_riset", label: "Penelitian atau Riset" },
  { value: "seminar_kp", label: "Seminar Kerja Praktik" },
  { value: "seminar_hasil", label: "Seminar Hasil Penelitian" },
  { value: "bimbingan_akademik", label: "Bimbingan/Diskusi Akademik" },
  { value: "kegiatan_akademik", label: "Kegiatan Akademik (KBM)" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export type NonPraktikumValue = (typeof NON_PRAKTIKUM_OPTIONS)[number]["value"];

export function nonPraktikumLabel(value: string | null | undefined): string {
  return NON_PRAKTIKUM_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "-";
}

// ---- Administrasi penyelesaian kegiatan ----

export const INSIDEN_OPTIONS = [
  { value: "rusak_pecah", label: "Rusak / Pecah" },
  { value: "hilang", label: "Hilang" },
  { value: "tumpah", label: "Tumpah" },
  { value: "lainnya", label: "Lainnya" },
] as const;

export type IncidentValue = (typeof INSIDEN_OPTIONS)[number]["value"];

export function insidenLabel(value: string | null | undefined): string {
  return INSIDEN_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "-";
}

export const DOC_SLOTS_PRAKTIKUM = [
  { key: "doc_pretest", label: "Dokumentasi Pre Test" },
  { key: "doc_tes_alat", label: "Dokumentasi Tes Alat" },
  { key: "doc_praktikum", label: "Dokumentasi Praktikum" },
] as const;

export const DOC_SLOTS_NON_PRAKTIKUM = [
  { key: "doc_kegiatan", label: "Dokumentasi Kegiatan" },
] as const;

export type DocSlotKey =
  | "doc_pretest"
  | "doc_tes_alat"
  | "doc_praktikum"
  | "doc_kegiatan"
  | "insiden_dokumentasi";
