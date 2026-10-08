import { PracticumRequest } from "@/types";

export type StatusFilterValue = "all" | "pending" | "acted" | "admin_done" | "activity_pending";
export type SortDirection = "asc" | "desc";

export const STATUS_FILTER_LABELS: Record<StatusFilterValue, string> = {
  all: "Semua Status",
  pending: "Baru Masuk (Belum Diaksi)",
  acted: "Sudah Diaksi (Disetujui/Ditolak)",
  admin_done: "Selesai Administrasi",
  activity_pending: "Kegiatan Selesai, Administrasi Belum",
};

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

  if (filter === "activity_pending") {
    if (r.status !== "approved" || r.completed) return false;
    // Bandingkan cuma tanggalnya (bukan jam) — "kegiatan sudah lewat"
    // berarti tanggal kegiatan < hari ini.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tanggalKegiatan = new Date(r.tanggal);
    tanggalKegiatan.setHours(0, 0, 0, 0);
    return tanggalKegiatan < today;
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
  if (r.completed) return "Selesai";
  if (r.completed_at) return "Sedang Direvisi";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tanggalKegiatan = new Date(r.tanggal);
  tanggalKegiatan.setHours(0, 0, 0, 0);
  return tanggalKegiatan < today ? "Belum Selesai (Kegiatan Sudah Lewat)" : "Belum Selesai";
}
