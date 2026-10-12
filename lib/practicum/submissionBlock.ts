import type { SupabaseClient } from "@supabase/supabase-js";
import { nonPraktikumLabel } from "@/lib/constants/kegiatan";
import { wibDateTime } from "@/lib/practicum/schedule";
import { formatDate } from "@/lib/utils";

/**
 * Alasan pengaju BELUM boleh mengajukan kegiatan baru. SATU sumber kebenaran,
 * dipakai oleh API POST /api/practicum/requests (penegakan) dan halaman
 * "Ajukan Kegiatan" (peringatan di depan, sebelum form diisi).
 *
 * Urutan prioritas (kalau ada beberapa sekaligus, yang paling "dekat selesai"
 * dilaporkan lebih dulu):
 *  1. revision_pending_review — revisi sudah dikirim, menunggu verifikasi.
 *  2. revision_requested      — admin/asisten meminta revisi, pengaju belum mengirim.
 *  3. admin_overdue           — kegiatan sudah lewat tapi administrasi belum dilengkapi.
 */
export type SubmissionBlockReason = "revision_pending_review" | "revision_requested" | "admin_overdue";

export type SubmissionBlock = {
  reason: SubmissionBlockReason;
  requestId: string;
  message: string;
};

type Row = {
  id: string;
  tanggal: string;
  jam_selesai: string;
  jenis_kegiatan: "praktikum" | "non_praktikum";
  praktikum_nama: string | null;
  modul: string | null;
  kegiatan_non_praktikum: string | null;
  completed_at: string | null;
  revisi_diajukan_at?: string | null;
};

const BASE_COLS = "id, tanggal, jam_selesai, jenis_kegiatan, praktikum_nama, modul, kegiatan_non_praktikum, completed_at";

function kegiatanLabel(r: Row): string {
  return r.jenis_kegiatan === "praktikum"
    ? [r.praktikum_nama, r.modul].filter(Boolean).join(" — ") || "Praktikum"
    : nonPraktikumLabel(r.kegiatan_non_praktikum);
}

export async function getSubmissionBlock(
  supabase: SupabaseClient,
  requesterId: string
): Promise<SubmissionBlock | null> {
  const run = (cols: string) =>
    supabase
      .from("practicum_requests")
      .select(cols)
      .eq("requester_id", requesterId)
      .eq("status", "approved")
      .eq("completed", false);

  // Kolom revisi_diajukan_at baru ada setelah migrasi 007. Kalau belum
  // dijalankan, ulangi tanpa kolom itu (semua revisi dianggap "diminta").
  let res = await run(`${BASE_COLS}, revisi_diajukan_at`);
  if (res.error) res = await run(BASE_COLS);
  if (res.error) {
    console.error("Cek blokir pengajuan error", res.error);
    return null;
  }

  const rows = (res.data ?? []) as unknown as Row[];
  const now = Date.now();
  const desc = (r: Row) => `"${kegiatanLabel(r)}" (${formatDate(r.tanggal)})`;

  // completed=false + completed_at terisi = pernah selesai lalu dibuka kembali (revisi).
  const pendingReview = rows.find((r) => r.completed_at && r.revisi_diajukan_at);
  if (pendingReview) {
    return {
      reason: "revision_pending_review",
      requestId: pendingReview.id,
      message: `Revisi administrasi kegiatan ${desc(pendingReview)} sudah kamu kirim dan sedang menunggu verifikasi admin/asisten. Kamu belum bisa mengajukan kegiatan baru sampai revisinya disetujui.`,
    };
  }

  const requested = rows.find((r) => r.completed_at && !r.revisi_diajukan_at);
  if (requested) {
    return {
      reason: "revision_requested",
      requestId: requested.id,
      message: `Administrasi kegiatan ${desc(requested)} diminta untuk direvisi. Perbaiki lewat menu Status Pengajuan, lalu tunggu revisinya disetujui admin/asisten sebelum mengajukan kegiatan baru.`,
    };
  }

  const overdue = rows.find((r) => {
    // Kegiatan disimpan dalam waktu lokal WIB; wibDateTime menormalkan "HH:MM:SS".
    const end = wibDateTime(r.tanggal, r.jam_selesai);
    return !!end && end.getTime() < now;
  });
  if (overdue) {
    return {
      reason: "admin_overdue",
      requestId: overdue.id,
      message: `Kamu masih punya kegiatan ${desc(overdue)} yang sudah selesai tapi administrasinya belum dilengkapi. Mohon selesaikan dulu lewat menu Status Pengajuan sebelum mengajukan kegiatan baru.`,
    };
  }

  return null;
}
