import { AppRole } from "@/lib/auth/session";

/**
 * Tabel admin generic (lib/admin/config.ts) yang boleh diakses role SELAIN
 * admin. Admin selalu boleh akses semua tabel — tidak perlu didaftarkan di
 * sini. Untuk asisten, saat ini cuma "announcements". "dosen" belum punya
 * fitur apa pun, jadi sengaja tidak didaftarkan di sini sama sekali.
 */
const NON_ADMIN_TABLE_ACCESS: Partial<Record<AppRole, string[]>> = {
  asisten: ["announcements"],
};

export function canAccessAdminTable(role: AppRole, table: string): boolean {
  if (role === "admin") return true;
  return NON_ADMIN_TABLE_ACCESS[role]?.includes(table) ?? false;
}

/** Approve/reject/hapus pengajuan praktikum — HANYA admin. */
export function canManagePracticumRequests(role: AppRole): boolean {
  return role === "admin";
}

/** Melihat daftar & status pengajuan praktikum — admin dan asisten. */
export function canViewPracticumRequests(role: AppRole): boolean {
  return role === "admin" || role === "asisten";
}
