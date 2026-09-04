import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Middleware jalan di Edge Runtime, jadi tidak bisa pakai next/headers atau
// lib/auth/session.ts (yang bergantung cookies() request-scoped biasa) —
// verifikasi token dilakukan ulang secara ringan di sini.
const SESSION_COOKIE = "lab_session";

function secretKey() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function getAppRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const key = secretKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { audience: "authenticated" });
    return (payload.app_role as string) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedPracticumRoute =
    pathname.startsWith("/practicum/ajukan") || pathname.startsWith("/practicum/status");

  if (!isAdminRoute && !isProtectedPracticumRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const appRole = await getAppRole(token);

  if (!appRole) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && appRole !== "admin") {
    return NextResponse.redirect(new URL("/practicum/status", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/practicum/ajukan/:path*", "/practicum/status/:path*"],
};
