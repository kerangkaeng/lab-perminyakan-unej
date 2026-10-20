import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

// Admin mengisi/menghapus nama + gelar seorang user (dosen) untuk tanda tangan di surat.
//   PATCH /api/admin/users/<id>/nama-gelar   body: { nama_gelar: string }   (kosong = hapus)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{32,36}$/i;
// Huruf (termasuk beraksen), titik, koma, spasi, kurung, apostrof, strip, garis miring.
const ALLOWED = /^[\p{L}\p{M}.,'’()\-/ ]+$/u;

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  if (session.appRole !== "admin") return NextResponse.json({ error: "Hanya admin yang dapat mengubah nama dan gelar." }, { status: 403 });
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  let body: { nama_gelar?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
  const raw = typeof body.nama_gelar === "string" ? body.nama_gelar.replace(/\s+/g, " ").trim() : "";
  if (raw.length > 150) return NextResponse.json({ error: "Nama dan gelar maksimal 150 karakter." }, { status: 400 });
  if (raw && !ALLOWED.test(raw)) {
    return NextResponse.json({ error: "Hanya huruf, titik, koma, spasi, tanda kurung, dan strip yang diizinkan." }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("users")
    .update({ nama_gelar: raw || null })
    .eq("id", id)
    .select("id, nama_gelar");
  if (error) {
    console.error("Update nama_gelar error", error);
    const missing = error.code === "42703" || /nama_gelar/.test(error.message ?? "");
    return NextResponse.json(
      { error: missing ? "Kolom nama_gelar belum ada. Jalankan migrasi 012_users_nama_gelar.sql dulu." : "Gagal menyimpan." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, nama_gelar: data[0].nama_gelar });
}
