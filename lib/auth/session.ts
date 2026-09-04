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
  nim: string;
  nama: string;
  appRole: AppRole;
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
    nim: payload.nim,
    nama: payload.nama,
    app_role: payload.appRole,
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
    if (!payload.sub || !payload.users_id || !payload.nim || !payload.app_role) return null;

    return {
      sub: payload.sub as string,
      usersId: payload.users_id as string,
      nim: payload.nim as string,
      nama: (payload.nama as string) || (payload.nim as string),
      appRole: payload.app_role as AppRole,
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
