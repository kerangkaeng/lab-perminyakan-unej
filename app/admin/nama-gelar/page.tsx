import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NamaGelarEditor } from "@/components/admin/NamaGelarEditor";

export const revalidate = 0;

type Row = { id: string; nama: string; nip: string | null; nim: string | null; user_type: string | null; nama_gelar: string | null };

// Admin mengisi nama + gelar dosen yang tampil di tanda tangan surat (SSO tidak mengirim gelar).
// Hanya menampilkan dosen; ?q= mencari di antara dosen.
export default async function NamaGelarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session || session.appRole !== "admin") return notFound();

  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").replace(/[,()%*\\]/g, " ").trim();
  const db = supabaseServer();

  const cols = "id, nama, nip, nim, user_type, nama_gelar";
  let rows: Row[] = [];
  let loadError: string | null = null;

  // Hanya dosen: user_type dari SSO memuat "dosen" atau role aplikasinya dosen.
  const onlyDosen = "user_type.ilike.%dosen%,role.eq.dosen";
  let query = db.from("users").select(cols).or(onlyDosen);
  if (q.length >= 2) query = query.or(`nama.ilike.%${q}%,nip.ilike.%${q}%,nim.ilike.%${q}%`);
  const { data, error } = await query.order("nama", { ascending: true }).limit(300);
  if (error) loadError = error.code === "42703" ? "migrasi" : "gagal";
  rows = (data ?? []) as Row[];

  return (
    <DashboardShell title="Nama & Gelar Dosen">
      <p className="mb-6 max-w-2xl text-core">
        Nama dari SSO tidak memuat gelar. Isi nama lengkap beserta gelar di sini; isian ini dipakai pada tanda tangan surat
        persetujuan. Kalau dikosongkan, surat memakai nama dari SSO.
      </p>

      <form className="mb-6 flex max-w-xl gap-2" action="/admin/nama-gelar" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari dosen (nama / NIP)"
          className="w-full min-w-0 border border-line bg-paper px-2 py-1.5 text-sm"
        />
        <button type="submit" className="shrink-0 border border-line px-3 py-1.5 text-xs text-ink hover:bg-mist">
          Cari
        </button>
      </form>

      {loadError === "migrasi" ? (
        <p className="max-w-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Kolom <code>nama_gelar</code> belum ada. Jalankan migrasi <code>012_users_nama_gelar.sql</code> di Supabase terlebih dahulu.
        </p>
      ) : loadError ? (
        <p className="text-sm text-red-700">Gagal memuat daftar pengguna.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-core">Tidak ada dosen ditemukan.</p>
      ) : (
        <ul className="max-w-3xl divide-y divide-line border border-line">
          {rows.map((u) => (
            <li key={u.id} className="space-y-2 px-4 py-3 text-sm">
              <p className="text-ink">
                {u.nama}
                <span className="ml-2 font-mono text-xs text-core">{u.nip ?? u.nim ?? ""}</span>
              </p>
              <NamaGelarEditor userId={u.id} initial={u.nama_gelar} placeholder={`mis. Dr. ${u.nama}, S.T., M.T.`} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
