import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getCasLogoutUrl } from "@/lib/auth/cas";

export async function GET(req: NextRequest) {
  // Hapus cookie sesi app INI, lalu redirect ke endpoint logout CAS supaya
  // cookie TGT (sesi SSO) di sso.unej.ac.id ikut mati. Tanpa langkah kedua ini,
  // klik "Masuk dengan SSO UNEJ" berikutnya akan auto-skip pakai sesi lama.
  const returnTo = new URL("/", req.nextUrl.origin);
  const res = NextResponse.redirect(getCasLogoutUrl(returnTo.toString()));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
