import { NextRequest, NextResponse } from "next/server";
import { getCasLoginUrl } from "@/lib/auth/cas";

export async function GET(req: NextRequest) {
  const redirectPath = req.nextUrl.searchParams.get("redirect") || "/practicum/status";

  const serviceUrl = new URL("/api/auth/cas/callback", req.nextUrl.origin);
  serviceUrl.searchParams.set("redirect", redirectPath);

  // renew: true -> selalu minta autentikasi ulang ke CAS (NIM/password + 2FA),
  // jangan pernah SSO-skip pakai sesi CAS yang mungkin masih aktif di browser.
  return NextResponse.redirect(getCasLoginUrl(serviceUrl.toString(), { renew: true }));
}
