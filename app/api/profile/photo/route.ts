import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  uploadPrivateFile,
  deletePrivateFile,
  getPrivateSignedUrl,
  detectImageType,
  isProfilePhotoKey,
  MAX_PROFILE_PHOTO_BYTES,
  PROFILE_PHOTO_PREFIX,
  PROFILE_PHOTO_TYPES,
} from "@/lib/storage/b2";

// Foto profil diunggah sendiri oleh user yang sedang login. Penulisan ke
// tabel users memakai service role, tapi SELALU dibatasi ke session.usersId
// (bukan id dari request), jadi user hanya bisa mengubah fotonya sendiri.

async function currentFoto(usersId: string): Promise<string | null> {
  const { data } = await supabaseServer().from("users").select("foto").eq("id", usersId).single();
  return (data?.foto as string | null) ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Berkas foto tidak valid." }, { status: 400 });
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return NextResponse.json(
      { error: `Ukuran foto maks. 1 MB. Ukuran file kamu: ${(file.size / (1024 * 1024)).toFixed(2)} MB.` },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buf);
  if (!type) {
    return NextResponse.json({ error: "Format foto harus JPG, PNG, atau WebP." }, { status: 400 });
  }

  const key = `${PROFILE_PHOTO_PREFIX}${session.usersId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${PROFILE_PHOTO_TYPES[type]}`;

  try {
    const oldKey = await currentFoto(session.usersId);
    await uploadPrivateFile(buf, key, type);

    const { error } = await supabaseServer().from("users").update({ foto: key }).eq("id", session.usersId);
    if (error) {
      await deletePrivateFile(key).catch(() => {});
      console.error("Simpan foto profil error", error);
      return NextResponse.json({ error: "Gagal menyimpan foto profil." }, { status: 500 });
    }

    if (isProfilePhotoKey(oldKey, session.usersId)) {
      await deletePrivateFile(oldKey).catch((e) => console.error("Hapus foto lama gagal", e));
    }

    return NextResponse.json({ url: await getPrivateSignedUrl(key) });
  } catch (e) {
    console.error("Upload foto profil error", e);
    return NextResponse.json({ error: "Gagal mengunggah foto profil." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  try {
    const oldKey = await currentFoto(session.usersId);
    const { error } = await supabaseServer().from("users").update({ foto: null }).eq("id", session.usersId);
    if (error) {
      console.error("Hapus foto profil error", error);
      return NextResponse.json({ error: "Gagal menghapus foto profil." }, { status: 500 });
    }
    if (isProfilePhotoKey(oldKey, session.usersId)) {
      await deletePrivateFile(oldKey).catch((e) => console.error("Hapus file foto gagal", e));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Hapus foto profil error", e);
    return NextResponse.json({ error: "Gagal menghapus foto profil." }, { status: 500 });
  }
}
