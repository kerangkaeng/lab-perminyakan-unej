import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { uploadPublicFile, buildKey } from "@/lib/storage/b2";

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

  const key = buildKey("news/inline", file.name);

  try {
    const url = await uploadPublicFile(file, key, file.type || "image/jpeg");
    return NextResponse.json({ url });
  } catch (uploadError) {
    console.error("Upload gambar inline error", uploadError);
    return NextResponse.json({ error: "Gagal mengunggah gambar." }, { status: 500 });
  }
}
