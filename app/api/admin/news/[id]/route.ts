import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { uploadPublicFile, buildKey, assertFileSize, FileTooLargeError } from "@/lib/storage/b2";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token || session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const title = form?.get("title");
  const date = form?.get("date");
  const excerpt = form?.get("excerpt");
  const content = form?.get("content");
  const status = form?.get("status") === "published" ? "published" : "draft";
  const file = form?.get("cover_image");

  if (
    typeof title !== "string" || !title.trim() ||
    typeof date !== "string" || !date ||
    typeof excerpt !== "string" || !excerpt.trim() ||
    typeof content !== "string" || !content.trim()
  ) {
    return NextResponse.json({ error: "Mohon lengkapi semua kolom wajib." }, { status: 400 });
  }

  const supabase = supabaseAuthed(token);

  const updatePayload: Record<string, unknown> = {
    title: title.trim(),
    date,
    excerpt: excerpt.trim(),
    content,
    status,
    updated_at: new Date().toISOString(),
  };

  if (file instanceof File && file.size > 0) {
    try {
      assertFileSize(file, "image");
    } catch (e) {
      if (e instanceof FileTooLargeError) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      throw e;
    }
    const key = buildKey("news", file.name);
    try {
      updatePayload.cover_image = await uploadPublicFile(file, key, file.type || "image/jpeg");
    } catch (uploadError) {
      console.error("Upload cover berita error", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah gambar sampul." }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("news")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Update berita error", error);
    return NextResponse.json({ error: "Gagal menyimpan perubahan." }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token || session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 });
  }

  const supabase = supabaseAuthed(token);
  const { error } = await supabase.from("news").delete().eq("id", params.id);

  if (error) {
    console.error("Hapus berita error", error);
    return NextResponse.json({ error: "Gagal menghapus berita." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
