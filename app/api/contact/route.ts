import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  // Tahap 2: simpan ke Supabase, atau kirim via email service.
  console.log({ name, email, message });

  return NextResponse.json({ ok: true });
}
