import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { fetchPrivateFileForProxy, isProfilePhotoKey } from "@/lib/storage/b2";

// GET /api/public/staff-photo/<userId>?v=<versi>
// Foto pemegang Jabatan Lab untuk halaman publik Struktur Organisasi.
// Bucket tetap privat; route ini hanya melayani foto user yang MEMANG memegang
// jabatan struktural (bukan admin sistem saja), sehingga foto user biasa
// tidak bisa diambil lewat sini.

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{32,36}$/i;

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  if (!UUID.test(userId)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const db = supabaseServer();
  const { data: roles } = await db
    .from("lab_roles")
    .select("id")
    .eq("user_id", userId)
    .neq("role_type", "admin")
    .limit(1);
  if (!roles || roles.length === 0) {
    return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  }

  const { data: user } = await db.from("users").select("foto").eq("id", userId).single();
  const key = (user?.foto as string | null) ?? null;
  if (!isProfilePhotoKey(key, userId)) {
    return NextResponse.json({ error: "Belum ada foto." }, { status: 404 });
  }

  const file = await fetchPrivateFileForProxy(key);
  if (!file) {
    return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.body) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
      // ?v= berubah saat foto diganti, jadi aman di-cache lama.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
