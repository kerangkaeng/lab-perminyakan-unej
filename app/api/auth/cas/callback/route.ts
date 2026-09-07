import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateCasTicket } from "@/lib/auth/cas";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const ticket = req.nextUrl.searchParams.get("ticket");
  const redirectPath = req.nextUrl.searchParams.get("redirect") || "/practicum/status";
  const loginUrl = new URL("/login", req.nextUrl.origin);

  if (!ticket) {
    loginUrl.searchParams.set("error", "missing_ticket");
    return NextResponse.redirect(loginUrl);
  }

  const serviceUrl = new URL("/api/auth/cas/callback", req.nextUrl.origin);
  serviceUrl.searchParams.set("redirect", redirectPath);

  const casUser = await validateCasTicket(ticket, serviceUrl.toString());
  if (!casUser) {
    loginUrl.searchParams.set("error", "invalid_ticket");
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const syntheticEmail = `${casUser.identifier}@cas.unej.local`;

  // Cari akun auth.users yang sudah ada berdasarkan email sintetis — dipakai
  // sebagai fallback kalau createUser() gagal karena email sudah terdaftar
  // (sisa dari percobaan login sebelumnya yang gagal di tengah jalan, mis.
  // insert ke public.users gagal setelah auth.users berhasil dibuat).
  async function findAuthUserByEmail(email: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      if (!res.ok) return null;
      const body = await res.json();
      const list: any[] = Array.isArray(body) ? body : body.users ?? [];
      return list.find((u) => u.email === email)?.id ?? null;
    } catch (e) {
      console.error("CAS callback - lookup existing auth user error", e);
      return null;
    }
  }

  async function provisionAuthUser(): Promise<string | null> {
    const { data: authUser, error: createAuthError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: { identifier: casUser!.identifier, source: "cas-unej" },
    });

    if (!createAuthError && authUser?.user) {
      return authUser.user.id;
    }

    // Email sudah terdaftar -> kemungkinan sisa percobaan gagal sebelumnya.
    // Pakai lagi akun auth yang sama alih-alih gagal total.
    const status = (createAuthError as any)?.status;
    const code = (createAuthError as any)?.code;
    if (status === 422 || code === "email_exists") {
      const existingId = await findAuthUserByEmail(syntheticEmail);
      if (existingId) return existingId;
    }

    console.error("CAS callback - create auth user error", createAuthError);
