import { NextRequest, NextResponse } from "next/server";
import { fetchPublicFileForProxy } from "@/lib/storage/b2";

// GET /api/files/<key...>
// Contoh: /api/files/news/1737000000000-a1b2c3-cover.jpg
// -> key yang dicari di B2: news/1737000000000-a1b2c3-cover.jpg
//
// Ini "jembatan" ke bucket B2_BUCKET_PUBLIC yang sebenarnya PRIVATE di
// sisi Backblaze. Route ini yang autentikasi ke B2 pakai kredensial
// server, ambil filenya, lalu forward ke browser pengunjung. Dari sisi
// pengunjung, URL ini terasa seperti file publik biasa (bisa dipakai
// langsung di <img src>), padahal di baliknya lewat server kita.
//
// Route ini sengaja TIDAK memerlukan login — karena isinya memang
// konten publik situs (cover berita, foto equipment/facility, dll).
// Untuk dokumen privat (dokumentasi praktikum), pakai signed URL dari
// getPrivateSignedUrl(s)() di route lain, BUKAN route ini.

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  const key = params.key?.join("/");

  if (!key) {
    return NextResponse.json({ error: "Key file tidak valid." }, { status: 400 });
  }

  const file = await fetchPublicFileForProxy(key);

  if (!file) {
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.body) as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      // Aman di-cache lama di browser/CDN karena setiap key sudah unik
      // (buildKey() menyisipkan timestamp + random string), jadi kalau
      // filenya ganti, key/URL-nya juga otomatis beda.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
