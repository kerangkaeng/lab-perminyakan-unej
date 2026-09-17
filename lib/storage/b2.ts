import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================
// Backblaze B2 client (S3-compatible, dipilih karena tidak butuh kartu
// kredit untuk daftar). KEDUA bucket sengaja dibuat PRIVATE — Backblaze
// mewajibkan kartu/biaya verifikasi $1 khusus untuk mengaktifkan bucket
// PUBLIC, jadi kita hindari itu sepenuhnya.
//
//   - B2_BUCKET_PUBLIC  : file yang boleh dilihat siapa saja (cover
//                         berita, foto equipment, foto facility, dll).
//                         Diakses lewat proxy kita sendiri
//                         (/api/files/[...key]), BUKAN langsung ke B2 —
//                         jadi bucket tetap private di sisi B2, tapi
//                         hasil akhirnya tetap terasa "publik" untuk
//                         pengunjung situs.
//   - B2_BUCKET_PRIVATE : dokumentasi praktikum & insiden mahasiswa.
//                         Diakses lewat signed URL sementara yang
//                         mengecek kepemilikan (lihat route
//                         documentation/route.ts).
// ============================================================

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} belum diset.`);
  return v;
}

export const B2_BUCKET_PUBLIC = process.env.B2_BUCKET_PUBLIC || "lab-content-public";
export const B2_BUCKET_PRIVATE = process.env.B2_BUCKET_PRIVATE || "lab-practicum-docs";

let cachedClient: S3Client | null = null;

function storageClient(): S3Client {
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: process.env.B2_REGION || "us-west-004",
    endpoint: requiredEnv("B2_ENDPOINT"),
    credentials: {
      accessKeyId: requiredEnv("B2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("B2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

/**
 * Bikin path/key penyimpanan yang aman & unik.
 * Contoh hasil: news/1737000000000-a1b2c3-cover.jpg
 */
export function buildKey(folder: string, filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const safeName = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const random = Math.random().toString(36).slice(2, 8);
  return `${folder}/${Date.now()}-${random}-${safeName}.${ext}`;
}

/**
 * Upload ke bucket "publik" (yang secara teknis tetap private di B2).
 * Mengembalikan URL PROXY di situs kita sendiri (/api/files/<key>) —
 * ini yang dipakai langsung di <img src="..."> atau <a href="...">.
 * Tidak pernah kedaluwarsa (beda dengan signed URL).
 */
export async function uploadPublicFile(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  const client = storageClient();
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const type = contentType || (file instanceof File ? file.type : "application/octet-stream");

  await client.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET_PUBLIC,
      Key: key,
      Body: body,
      ContentType: type || "application/octet-stream",
    })
  );

  return `/api/files/${key}`;
}

/**
 * Ambil isi file dari bucket publik untuk di-stream lewat proxy route
 * kita (/api/files/[...key]). Dipakai server-side saja.
 */
export async function fetchPublicFileForProxy(key: string): Promise<{
  body: Uint8Array;
  contentType: string;
} | null> {
  const client = storageClient();
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: B2_BUCKET_PUBLIC, Key: key }));
    if (!result.Body) return null;
    const bytes = await result.Body.transformToByteArray();
    return {
      body: bytes,
      contentType: result.ContentType || "application/octet-stream",
    };
  } catch (e) {
    console.error("fetchPublicFileForProxy error", e);
    return null;
  }
}

/**
 * Upload ke bucket PRIVAT. Mengembalikan cuma key/path-nya (BUKAN URL),
 * karena file ini tidak boleh diakses langsung — harus lewat
 * getPrivateSignedUrl() setiap kali mau ditampilkan, dan biasanya
 * dilindungi pengecekan kepemilikan/role di route pemanggilnya.
 */
export async function uploadPrivateFile(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  const client = storageClient();
  const body = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const type = contentType || (file instanceof File ? file.type : "application/octet-stream");

  await client.send(
    new PutObjectCommand({
      Bucket: B2_BUCKET_PRIVATE,
      Key: key,
      Body: body,
      ContentType: type || "application/octet-stream",
    })
  );

  return key;
}

/**
 * Buat URL sementara (default 1 jam) untuk file di bucket privat.
 * Dipakai persis seperti Supabase createSignedUrl dulu.
 */
export async function getPrivateSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = storageClient();
  const command = new GetObjectCommand({ Bucket: B2_BUCKET_PRIVATE, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getPrivateSignedUrls(
  keys: string[],
  expiresInSeconds = 3600
): Promise<{ key: string; url: string }[]> {
  return Promise.all(
    keys.map(async (key) => ({ key, url: await getPrivateSignedUrl(key, expiresInSeconds) }))
  );
}

/** Hapus file dari bucket publik. */
export async function deletePublicFile(key: string): Promise<void> {
  const client = storageClient();
  await client.send(new DeleteObjectCommand({ Bucket: B2_BUCKET_PUBLIC, Key: key }));
}

/** Hapus file dari bucket privat. */
export async function deletePrivateFile(key: string): Promise<void> {
  const client = storageClient();
  await client.send(new DeleteObjectCommand({ Bucket: B2_BUCKET_PRIVATE, Key: key }));
}

/**
 * Ekstrak key/path dari URL proxy kita (/api/files/xxx), kebalikan dari
 * uploadPublicFile. Dipakai saat mau hapus file lama berdasarkan URL
 * yang tersimpan di DB.
 */
export function keyFromProxyUrl(url: string): string | null {
  const prefix = "/api/files/";
  const idx = url.indexOf(prefix);
  if (idx === -1) return null;
  return url.slice(idx + prefix.length);
}
