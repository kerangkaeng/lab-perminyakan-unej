  import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { slugify } from "@/lib/utils";

const BUCKET = "content-images";

export async function POST(req: NextRequest) {
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

  // Buat slug unik dari judul — kalau sudah dipakai, tambahkan angka di belakang.
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: existing } = await supabase.from("news").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  let coverImageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `news/${slug}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type || "image/jpeg" });

    if (uploadError) {
      console.error("Upload cover berita error", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah gambar sampul." }, { status: 500 });
    }

    coverImageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("news")
    .insert({
      slug,
      title: title.trim(),
      date,
      excerpt: excerpt.trim(),
      content: content.trim(),
      cover_image: coverImageUrl,
      created_by: session.usersId,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert berita error", error);
    return NextResponse.json({ error: "Gagal menyimpan berita." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
