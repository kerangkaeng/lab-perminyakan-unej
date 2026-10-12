/**
 * Aturan "kapan persetujuan TIDAK boleh dibatalkan (ditolak)". SATU sumber
 * kebenaran: dipakai API (app/api/admin/practicum-requests/[id]/route.ts) untuk
 * menegakkan, dan tabel admin untuk menonaktifkan tombol Tolak + menjelaskan
 * alasannya sebelum diklik.
 *
 * Pengajuan yang sudah DISETUJUI tidak boleh berbalik jadi "ditolak" kalau
 * pengaju sudah mengunggah dokumentasi atau administrasinya sudah selesai
 * (termasuk yang sedang direvisi: dokumentasinya tetap tersimpan). Kalau
 * dibiarkan, data pengaju menggantung dan tidak konsisten.
 */
const DOC_KEYS = ["doc_pretest", "doc_tes_alat", "doc_praktikum", "doc_kegiatan", "insiden_dokumentasi"] as const;

export const APPROVAL_LOCKED_MESSAGE =
  "Persetujuan tidak bisa dibatalkan karena pengaju sudah mengunggah dokumentasi atau menyelesaikan administrasi.";

/** Pesan alasan kalau persetujuan terkunci, atau null kalau masih boleh ditolak. */
export function approvalLockReason(r: object): string | null {
  const t = r as Record<string, unknown>;
  if (t.status !== "approved") return null;
  const hasDocs = DOC_KEYS.some((k) => Array.isArray(t[k]) && (t[k] as unknown[]).length > 0);
  return t.completed === true || hasDocs ? APPROVAL_LOCKED_MESSAGE : null;
}
