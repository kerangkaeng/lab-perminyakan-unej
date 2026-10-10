// Sesi kustom untuk login CAS, disimpan sebagai JWT di cookie httpOnly.
//
// PENTING: token ini ditandatangani dengan SUPABASE_JWT_SECRET (secret proyek
// Supabase yang sama dipakai untuk menandatangani token anon/service_role).
// Klaim `role: "authenticated"` WAJIB persis begitu karena PostgREST memakai
// klaim ini untuk menentukan role Postgres yang dipakai saat query (bukan
// role aplikasi kita "mahasiswa"/"admin" — itu disimpan terpisah sebagai
// `app_role` supaya tidak bentrok). Dengan begini auth.uid() di RLS akan
// bernilai `sub` (auth_uid) dari token ini, meskipun user login lewat CAS,
// bukan lewat Supabase Auth langsung.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";

export const SESSION_COOKIE = "lab_session";

function secretKey() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export type AppRole = "mahasiswa" | "admin" | "asisten" | "dosen";

export type Session = {
  sub: string; // auth_uid (id di auth.users)
  usersId: string; // id di public.users
  /** Bisa kosong untuk akun dosen/tendik (mereka pakai NIP, bukan NIM). */
  nim: string | null;
  nama: string;
  appRole: AppRole;
  /** Status asli dari SISTER (mahasiswa/dosen/tendik/dst), murni informasi identitas. */
  userType: string;
};

export async function createSessionToken(payload: Session) {
  const key = secretKey();
  if (!key) {
    throw new Error("SUPABASE_JWT_SECRET belum diset di environment variables.");
  }
  return await new SignJWT({
    aud: "authenticated",
    role: "authenticated",
    users_id: payload.usersId,
    nim: payload.nim ?? null,
    nama: payload.nama,
    app_role: payload.appRole,
    user_type: payload.userType,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  const key = secretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { audience: "authenticated" });

    // PENTING: `nim` SENGAJA tidak diwajibkan di sini. Akun dosen/tendik
    // (mis. login pakai NIK) punya `nim = null` by design — identitasnya
    // disimpan di kolom `nip`, bukan `nim`. Mewajibkan `nim` di sini akan
    // membuat sesi akun non-mahasiswa selalu dianggap tidak valid meskipun
    // token-nya benar dan cookie sudah ter-set dengan sukses.
    if (!payload.sub || !payload.users_id || !payload.app_role) return null;

    return {
      sub: payload.sub as string,
      usersId: payload.users_id as string,
      nim: (payload.nim as string | null) ?? null,
      nama: (payload.nama as string) || (payload.nim as string) || "Pengguna",
      appRole: payload.app_role as AppRole,
      userType: (payload.user_type as string) || "mahasiswa",
    };
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  // Next.js 15: cookies() bersifat async.
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Sesi saat ini. Role aplikasi SELALU dibaca ulang dari database (bukan
 * dari isi token), karena Jabatan Lab bisa diubah admin kapan saja — kalau
 * hanya mengandalkan token (berlaku 7 hari), pencopotan akses admin baru
 * berlaku setelah user login ulang. Di-cache per request supaya layout,
 * sidebar, dan halaman tidak query berulang.
 *
 * Catatan: middleware (Edge) tetap memakai role di token untuk menentukan
 * boleh/tidaknya MASUK ke path /admin, jadi user yang BARU dinaikkan
 * aksesnya perlu login ulang. Penurunan akses langsung berlaku karena
 * halaman & API selalu memeriksa lewat fungsi ini.
 */
async function resolveSession(): Promise<Session | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  try {
    const { data, error } = await supabaseServer()
      .from("users")
      .select("role")
      .eq("id", session.usersId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null; // akun sudah dihapus
    return { ...session, appRole: data.role as AppRole };
  } catch (e) {
    // Gagal memverifikasi role -> turunkan ke akses paling rendah (fail-safe).
    console.error("getSession - gagal membaca role terbaru", e);
    return { ...session, appRole: "mahasiswa" };
  }
}

export const getSession = cache(resolveSession);
