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
