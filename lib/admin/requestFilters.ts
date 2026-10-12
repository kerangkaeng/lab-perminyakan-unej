import { PracticumRequest } from "@/types";
import { todayWIB } from "@/lib/practicum/schedule";

export type StatusFilterValue =
  | "all"
  | "pending"
  | "acted"
  | "admin_done"
  | "activity_pending"
  | "revision_pending";
export type SortDirection = "asc" | "desc";

export const STATUS_FILTER_LABELS: Record<StatusFilterValue, string> = {
  all: "Semua Status",
  pending: "Baru Masuk (Belum Diaksi)",
  acted: "Sudah Diaksi (Disetujui/Ditolak)",
  admin_done: "Selesai Administrasi",
  activity_pending: "Kegiatan Selesai, Administrasi Belum",
  revision_pending: "Revisi Menunggu Verifikasi",
};

/**
 * Fase administrasi sebuah pengajuan yang DISETUJUI, turunan dari kolom mentah
 * (satu sumber kebenaran untuk UI admin, UI pengaju, filter, dan Excel):
 *  - "selesai"              completed = true
 *  - "menunggu_verifikasi"  revisi sudah dikirim pengaju, belum di-ACC
 *  - "sedang_direvisi"      revisi diminta, pengaju belum mengirim
 *  - "belum_selesai"        belum pernah diselesaikan
 */
export type AdminPhase = "selesai" | "menunggu_verifikasi" | "sedang_direvisi" | "belum_selesai";

export function adminPhase(
  r: Pick<PracticumRequest, "completed" | "completed_at" | "revisi_diajukan_at">
): AdminPhase {
  if (r.completed) return "selesai";
  if (r.completed_at && r.revisi_diajukan_at) return "menunggu_verifikasi";
  if (r.completed_at) return "sedang_direvisi";
  return "belum_selesai";
}

/**
 * Dipakai bersama oleh halaman Kelola Pengajuan (app/admin/practicum-requests/page.tsx)
 * dan endpoint rekap Excel (app/api/admin/practicum-requests/recap/route.ts), supaya
 * definisi "status turunan" ini SATU sumber kebenaran — tidak boleh menduplikasi logic
 * ini di dua tempat yang bisa diam-diam jadi tidak sinkron.
 *
 * Status di sini BUKAN langsung kolom `status` mentah — ini kategori turunan:
 * baru masuk (belum diaksi), sudah diaksi (approve/reject), selesai administrasi,
 * dan "kegiatan sudah lewat tanggal tapi administrasi belum diselesaikan"
 * (dihitung dari `tanggal` dibanding hari ini).
 */
export function matchesStatusFilter(r: PracticumRequest, filter: string): boolean {
  if (filter === "all") return true;

  if (filter === "pending") return r.status === "pending";
  if (filter === "acted") return r.status === "approved" || r.status === "rejected";
  if (filter === "admin_done") return r.status === "approved" && r.completed === true;

  if (filter === "revision_pending") {
    return r.status === "approved" && adminPhase(r) === "menunggu_verifikasi";
  }

  if (filter === "activity_pending") {
    if (r.status !== "approved" || r.completed) return false;
    // Bandingkan cuma tanggalnya (bukan jam) — "kegiatan sudah lewat"
    // berarti tanggal kegiatan < hari ini MENURUT WIB. Sengaja bandingkan
    // string YYYY-MM-DD, bukan Date + setHours: itu bergantung zona waktu
    // server (VPS biasanya UTC) dan meleset sehari pada 00.00–07.00 WIB.
    return r.tanggal < todayWIB();
  }

  return true;
}

export function filterAndSortRequests(
  requests: PracticumRequest[],
  opts: {
    jenis?: string;
    lab?: string;
    status?: string;
    urutan?: SortDirection;
    /** Rentang tanggal kegiatan (inclusive), format YYYY-MM-DD. Dipakai halaman Rekap. */
    dariTanggal?: string;
    sampaiTanggal?: string;
  }
): PracticumRequest[] {
  const jenisFilter = opts.jenis ?? "all";
  const labFilter = opts.lab ?? "all";
  const statusFilter = opts.status ?? "all";
  const urutan = opts.urutan === "asc" ? "asc" : "desc";

  return requests
    .filter((r) => jenisFilter === "all" || r.jenis_kegiatan === jenisFilter)
    .filter((r) => labFilter === "all" || r.lokasi === labFilter)
    .filter((r) => matchesStatusFilter(r, statusFilter))
    .filter((r) => !opts.dariTanggal || r.tanggal >= opts.dariTanggal)
    .filter((r) => !opts.sampaiTanggal || r.tanggal <= opts.sampaiTanggal)
    .sort((a, b) => {
      const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      return urutan === "asc" ? diff : -diff;
    });
}

/** Label status mentah (kolom `status` asli), dipakai sebagai salah satu kolom Excel. */
export function rawStatusLabel(status: PracticumRequest["status"]): string {
  if (status === "pending") return "Baru Masuk";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";
  return status;
}

/** Label status administrasi, dipakai sebagai salah satu kolom Excel. */
export function adminStatusLabel(r: PracticumRequest): string {
  if (r.status !== "approved") return "-";
  const phase = adminPhase(r);
  if (phase === "selesai") return "Selesai";
  if (phase === "menunggu_verifikasi") return "Menunggu Verifikasi Revisi";
  if (phase === "sedang_direvisi") return "Sedang Direvisi";
  return r.tanggal < todayWIB() ? "Belum Selesai (Kegiatan Sudah Lewat)" : "Belum Selesai";
}
