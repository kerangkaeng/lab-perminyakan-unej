// Nama tampilan dengan gelar. `users.nama` berasal dari SSO (tanpa gelar); `users.nama_gelar`
// diisi admin di /admin/nama-gelar. Dipakai di semua tampilan nama dosen KECUALI profil dan
// sidebar/navbar (yang sengaja tetap memakai nama SSO).

export type WithGelar = { nama: string; nama_gelar?: string | null };

export function displayName(u: WithGelar): string {
  return u.nama_gelar?.trim() || u.nama;
}

/** Salinan objek dengan `nama` diganti nama+gelar (kalau ada) dan nama_gelar dibuang. */
export function applyGelar<T extends WithGelar>(u: T): T {
  const { nama_gelar: _drop, ...rest } = u as T & { nama_gelar?: string | null };
  void _drop;
  return { ...(rest as T), nama: displayName(u) };
}

/**
 * Jalankan query yang ikut mengambil kolom `nama_gelar`; kalau kolom itu belum ada
 * (migrasi 012 belum dijalankan; kode 42703) ulangi tanpa kolom itu supaya halaman tidak rusak.
 */
export async function withGelarFallback<R extends { error: { code?: string } | null }>(
  build: (withGelar: boolean) => PromiseLike<R>
): Promise<R> {
  const first = await build(true);
  if (first.error?.code === "42703") return build(false);
  return first;
}

/** Potongan kolom untuk select: ", nama_gelar" atau "". */
export const gelarCol = (withGelar: boolean) => (withGelar ? ", nama_gelar" : "");
