import { NextRequest, NextResponse } from "next/server";
import { getCasLoginUrl } from "@/lib/auth/cas";

export async function GET(req: NextRequest) {
  const redirectPath = req.nextUrl.searchParams.get("redirect") || "/practicum/status";

  // `redirect` disisipkan sebagai query di service URL supaya bisa dibaca
  // lagi di callback setelah CAS redirect balik dengan ticket. Service URL
  // ini harus persis sama (termasuk query string ini) dengan yang dipakai
  // saat validasi ticket di /api/auth/cas/callback.
  const serviceUrl = new URL("/api/auth/cas/callback", req.nextUrl.origin);
  serviceUrl.searchParams.set("redirect", redirectPath);

  return NextResponse.redirect(getCasLoginUrl(serviceUrl.toString()));
}
