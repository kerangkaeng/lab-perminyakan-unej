import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  uploadPrivateFile,
  deletePrivateFile,
  fetchPrivateFileForProxy,
  detectImageType,
  isSignatureKey,
  signatureUrl,
  MAX_SIGNATURE_BYTES,
  SIGNATURE_PREFIX,
  SIGNATURE_TYPES,
} from "@/lib/storage/b2";

// Tanda tangan diunggah sendiri oleh user yang login. Penulisan ke tabel
// users memakai service role tapi SELALU dibatasi ke session.usersId, jadi
// user hanya bisa mengubah tanda tangannya sendiri. File disimpan di bucket
// privat; GET hanya melayani tanda tangan milik user yang sedang login.

export const dynamic = "force-dynamic";

async function currentTtd(usersId: string): Promise<string | null> {
  const { data } = await supabaseServer().from("users").select("ttd").eq("id", usersId).single();
  return (data?.ttd as string | null) ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });

  const key = await currentTtd(session.usersId);
  if (!isSignatureKey(key, session.usersId)) {
    return NextResponse.json({ error: "Belum ada tanda tangan." }, { status: 404 });
  }
  const file = await fetchPrivateFileForProxy(key);
  if (!file) return NextResponse.json({ error: "Tanda tangan tidak ditemukan." }, { status: 404 });

  return new NextResponse(Buffer.from(file.body) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Berkas tanda tangan tidak valid." }, { status: 400 });
  }
  if (file.size > MAX_SIGNATURE_BYTES) {
    return NextResponse.json(
      { error: `Ukuran file maks. 1 MB. Ukuran file kamu: ${(file.size / (1024 * 1024)).toFixed(2)} MB.` },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buf);
  if (!type || !(type in SIGNATURE_TYPES)) {
    return NextResponse.json({ error: "Format tanda tangan harus PNG atau JPG." }, { status: 400 });
  }

  const key = `${SIGNATURE_PREFIX}${session.usersId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${SIGNATURE_TYPES[type]}`;

  try {
    const oldKey = await currentTtd(session.usersId);
    await uploadPrivateFile(buf, key, type);

    const { error } = await supabaseServer().from("users").update({ ttd: key }).eq("id", session.usersId);
    if (error) {
      await deletePrivateFile(key).catch(() => {});
      console.error("Simpan tanda tangan error (sudah jalankan migrasi 010?)", error);
      return NextResponse.json({ error: "Gagal menyimpan tanda tangan." }, { status: 500 });
    }
    if (isSignatureKey(oldKey, session.usersId)) {
      await deletePrivateFile(oldKey).catch((e) => console.error("Hapus tanda tangan lama gagal", e));
    }
    return NextResponse.json({ url: signatureUrl(key) });
  } catch (e) {
    console.error("Upload tanda tangan error", e);
    return NextResponse.json({ error: "Gagal mengunggah tanda tangan." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });

  try {
    const oldKey = await currentTtd(session.usersId);
    const { error } = await supabaseServer().from("users").update({ ttd: null }).eq("id", session.usersId);
    if (error) {
      console.error("Hapus tanda tangan error", error);
      return NextResponse.json({ error: "Gagal menghapus tanda tangan." }, { status: 500 });
    }
    if (isSignatureKey(oldKey, session.usersId)) {
      await deletePrivateFile(oldKey).catch((e) => console.error("Hapus file tanda tangan gagal", e));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Hapus tanda tangan error", e);
    return NextResponse.json({ error: "Gagal menghapus tanda tangan." }, { status: 500 });
  }
}
