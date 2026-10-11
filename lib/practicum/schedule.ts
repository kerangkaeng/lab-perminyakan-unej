// Helper jadwal kegiatan lab — dipakai di API pengajuan (mahasiswa) dan
// API persetujuan (admin) supaya aturan jam/tanggal & bentrok SATU sumber.
//
// Semua perbandingan jam memakai format "HH:MM" (5 karakter). Kolom
// jam_mulai/jam_selesai di Postgres bertipe `time` mengembalikan "HH:MM:SS",
// sedangkan form mengirim "HH:MM" — selalu normalisasi sebelum membandingkan
// atau menyusun Date, jangan pernah menempel ":00" begitu saja.
import type { SupabaseClient } from "@supabase/supabase-js";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "08:00" / "08:00:00" -> "08:00"; selain itu null. */
export function toHHMM(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(TIME_RE);
  return m ? `${m[1]}:${m[2]}` : null;
}

/** Tanggal hari ini (YYYY-MM-DD) menurut WIB, apa pun zona waktu server. */
export function todayWIB(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Date untuk tanggal + jam (WIB). Invalid Date -> null. */
export function wibDateTime(tanggal: unknown, jam: unknown): Date | null {
  const hhmm = toHHMM(jam);
  if (typeof tanggal !== "string" || !DATE_RE.test(tanggal) || !hhmm) return null;
  const d = new Date(`${tanggal}T${hhmm}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ValidSchedule = { tanggal: string; jamMulai: string; jamSelesai: string };

/** Validasi tanggal & rentang jam. Mengembalikan pesan error atau jadwal ternormalisasi. */
export function validateSchedule(
  tanggal: unknown,
  jamMulai: unknown,
  jamSelesai: unknown
): { error: string } | { ok: ValidSchedule } {
  if (typeof tanggal !== "string" || !DATE_RE.test(tanggal) || Number.isNaN(new Date(`${tanggal}T00:00:00Z`).getTime())) {
    return { error: "Format tanggal tidak valid." };
  }
  const mulai = toHHMM(jamMulai);
  const selesai = toHHMM(jamSelesai);
  if (!mulai || !selesai) return { error: "Format jam tidak valid." };
  if (mulai >= selesai) return { error: "Jam selesai harus lebih besar dari jam mulai." };
  if (tanggal < todayWIB()) return { error: "Tanggal kegiatan tidak boleh sudah lewat." };
  return { ok: { tanggal, jamMulai: mulai, jamSelesai: selesai } };
}

export type ScheduleConflict = {
  id: string;
  jam_mulai: string;
  jam_selesai: string;
};

/**
 * Kegiatan yang SUDAH DISETUJUI dan bentrok dengan rentang yang diberikan di
 * lab + tanggal yang sama (overlap klasik: mulai_lain < selesai_baru DAN
 * selesai_lain > mulai_baru; kegiatan yang berurutan tanpa tumpang tindih
 * tidak dianggap bentrok). `client` harus bisa MELIHAT semua pengajuan
 * (service role, atau sesi admin) — klien milik mahasiswa/anon tidak bisa.
 */
export async function findApprovedConflicts(
  client: SupabaseClient,
  opts: { lokasi: string; tanggal: string; jamMulai: string; jamSelesai: string; excludeId?: string }
): Promise<{ data: ScheduleConflict[]; error: unknown }> {
  let q = client
    .from("practicum_requests")
    .select("id, jam_mulai, jam_selesai")
    .eq("status", "approved")
    .eq("lokasi", opts.lokasi)
    .eq("tanggal", opts.tanggal)
    .lt("jam_mulai", opts.jamSelesai)
    .gt("jam_selesai", opts.jamMulai);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  const { data, error } = await q;
  return { data: (data as ScheduleConflict[] | null) ?? [], error };
}

export function describeConflicts(rows: ScheduleConflict[]): string {
  return rows.map((r) => `${toHHMM(r.jam_mulai) ?? r.jam_mulai}–${toHHMM(r.jam_selesai) ?? r.jam_selesai}`).join(", ");
}
