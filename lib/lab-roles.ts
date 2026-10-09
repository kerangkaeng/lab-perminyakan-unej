// Konstanta & validasi Jabatan Lab — aman dipakai di server maupun client
// (tidak mengimpor apa pun yang server-only).

export const LAB_ROLE_TYPES = ["admin", "kepala_lab", "laboran", "dosen_peneliti", "dosen_mk", "asisten"] as const;
export type LabRoleType = (typeof LAB_ROLE_TYPES)[number];

export const LAB_ROLE_LABEL: Record<LabRoleType, string> = {
  admin: "Administrator Sistem",
  kepala_lab: "Kepala Laboratorium",
  laboran: "Laboran/Teknisi",
  dosen_peneliti: "Dosen Peneliti",
  dosen_mk: "Dosen MK Praktikum",
  asisten: "Asisten Praktikum",
};

export const BIDANG_VALUES = ["pemboran_produksi", "reservoir"] as const;
export type Bidang = (typeof BIDANG_VALUES)[number];

export const BIDANG_LABEL: Record<Bidang, string> = {
  pemboran_produksi: "Pemboran & Produksi",
  reservoir: "Reservoir",
};

/** 1 orang per bidang. */
export const EXCLUSIVE_TYPES: LabRoleType[] = ["kepala_lab", "laboran"];
/** Penugasan per Modul Praktikum (boleh banyak orang). */
export const MODULE_TYPES: LabRoleType[] = ["dosen_mk", "asisten"];

/** Pesan error kalau kombinasi tidak valid, atau null kalau valid. */
export function validateLabRole(type: unknown, bidang: unknown, moduleId: unknown): string | null {
  if (typeof type !== "string" || !(LAB_ROLE_TYPES as readonly string[]).includes(type)) {
    return "Jenis jabatan tidak valid.";
  }
  const t = type as LabRoleType;
  if (EXCLUSIVE_TYPES.includes(t)) {
    if (typeof bidang !== "string" || !(BIDANG_VALUES as readonly string[]).includes(bidang)) {
      return "Pilih bidang (Pemboran & Produksi atau Reservoir).";
    }
    if (moduleId) return "Jabatan ini tidak terkait modul praktikum.";
  } else if (MODULE_TYPES.includes(t)) {
    if (typeof moduleId !== "string" || !moduleId) return "Pilih modul praktikum.";
    if (bidang) return "Jabatan ini tidak terkait bidang.";
  } else if (bidang || moduleId) {
    return "Jabatan ini tidak memerlukan bidang atau modul.";
  }
  return null;
}

/** Teks ringkas, mis. "Kepala Laboratorium — Reservoir". */
export function describeLabRole(type: LabRoleType, bidang: string | null, moduleTitle?: string | null): string {
  const base = LAB_ROLE_LABEL[type] ?? type;
  if (bidang) return `${base} — ${BIDANG_LABEL[bidang as Bidang] ?? bidang}`;
  if (moduleTitle) return `${base} — ${moduleTitle}`;
  return base;
}
