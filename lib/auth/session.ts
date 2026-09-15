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

export const SESSION_COOKIE = "lab_session";

function secretKey() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export type AppRole = "mahasiswa" | "admin";

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

export function getSessionToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export async function getSession(): Promise<Session | null> {
  const token = getSessionToken();
  if (!token) return null;
  return verifySessionToken(token);
}
