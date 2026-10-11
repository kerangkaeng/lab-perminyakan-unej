// Guard untuk halaman Server Component khusus admin.
//
// middleware.ts hanya membaca role dari TOKEN (berlaku 7 hari), jadi admin yang
// sudah dicopot masih lolos middleware sampai tokennya habis. getSession()
// membaca ulang role dari database, jadi pengecekan di sini langsung berlaku.
// Halaman yang memakai service role / menampilkan data sensitif WAJIB
// memanggil ini (halaman yang cuma memakai supabaseAuthed tetap dibatasi RLS,
// tapi cek ini mencegah UI admin terbuka untuk non-admin).
import { notFound, redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth/session";

export async function requireAdminSession(returnTo = "/admin"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  if (session.appRole !== "admin") notFound();
  return session;
}
