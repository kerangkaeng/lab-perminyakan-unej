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

  // Harus persis sama dengan service URL yang dipakai saat redirect ke
  // /cas/login (lihat app/api/auth/cas/login/route.ts).
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

  const { data: existing, error: findError } = await admin
    .from("users")
    .select("id, auth_uid, nim, nip, nama, role")
    .eq("identifier", casUser.identifier)
    .maybeSingle();

  if (findError) {
    console.error("CAS callback - find user error", findError);
    loginUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(loginUrl);
  }

  let userRow = existing as { id: string; auth_uid: string | null; nim: string | null; nip: string | null; nama: string; role: "mahasiswa" | "admin" } | null;

  async function provisionAuthUser() {
    // auth.users dipakai murni sebagai sumber UUID stabil untuk auth_uid —
    // login sesungguhnya tetap lewat CAS, bukan email/password Supabase.
    const syntheticEmail = `${casUser!.identifier}@cas.unej.local`;
    const { data: authUser, error: createAuthError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: { identifier: casUser!.identifier, source: "cas-unej" },
    });
    if (createAuthError || !authUser?.user) {
      console.error("CAS callback - create auth user error", createAuthError);
      return null;
    }
    return authUser.user.id;
  }

  if (!userRow) {
    const authUid = await provisionAuthUser();
    if (!authUid) {
      loginUrl.searchParams.set("error", "server_error");
      return NextResponse.redirect(loginUrl);
    }

    // Belum tahu ini mahasiswa atau laboran dari CAS saja (attribute release
    // biasanya tidak membedakan jenis akun) — simpan sementara di `nim`.
    // Admin bisa pindahkan ke `nip` manual lewat SQL saat promote jadi admin
    // (lihat catatan promote-admin), murni untuk kerapian tampilan.
    const { data: inserted, error: insertError } = await admin
      .from("users")
      .insert({
        auth_uid: authUid,
        identifier: casUser.identifier,
        nim: casUser.identifier,
        nama: casUser.nama || casUser.identifier,
        prodi: casUser.prodi ?? null,
        role: "mahasiswa",
      })
      .select("id, auth_uid, nim, nip, nama, role")
      .single();

    if (insertError || !inserted) {
      console.error("CAS callback - insert user error", insertError);
      loginUrl.searchParams.set("error", "server_error");
      return NextResponse.redirect(loginUrl);
    }

    userRow = inserted;
  } else if (!userRow.auth_uid) {
    // Edge case: baris users sudah ada (mis. diimpor manual) tapi belum
    // tertaut ke auth.users. Buatkan sekali di sini.
    const authUid = await provisionAuthUser();
    if (!authUid) {
      loginUrl.searchParams.set("error", "server_error");
      return NextResponse.redirect(loginUrl);
    }

    const { data: updated, error: updateError } = await admin
      .from("users")
      .update({ auth_uid: authUid })
      .eq("id", userRow.id)
      .select("id, auth_uid, nim, nip, nama, role")
      .single();

    if (updateError || !updated) {
      console.error("CAS callback - update auth_uid error", updateError);
      loginUrl.searchParams.set("error", "server_error");
      return NextResponse.redirect(loginUrl);
    }

    userRow = updated;
  }

  const token = await createSessionToken({
    sub: userRow.auth_uid as string,
    usersId: userRow.id,
    nim: userRow.nip || userRow.nim || casUser.identifier,
    nama: userRow.nama,
    appRole: userRow.role,
  });

  const target = new URL(redirectPath, req.nextUrl.origin);
  const res = NextResponse.redirect(target);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
