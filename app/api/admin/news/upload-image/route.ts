import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";

const BUCKET = "content-images";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token || session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Berkas gambar tidak valid." }, { status: 400 });
  }

  const supabase = supabaseAuthed(token);
  const ext = file.name.split(".").pop() || "jpg";
  const path = `news/inline/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    console.error("Upload gambar inline error", uploadError);
    return NextResponse.json({ error: "Gagal mengunggah gambar." }, { status: 500 });
  }

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
