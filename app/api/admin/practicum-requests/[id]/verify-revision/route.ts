import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { canRequestRevision } from "@/lib/admin/permissions";
import { supabaseServer } from "@/lib/supabase/server";

// PATCH /api/admin/practicum-requests/[id]/verify-revision
// Body: { action: "acc" | "revisi_lagi", catatan?: string }
//
// Admin ATAU asisten memverifikasi revisi administrasi yang sudah dikirim
// pengaju (state "menunggu verifikasi": completed=false, completed_at terisi,
// revisi_diajukan_at terisi):
//  - "acc"        -> completed=true (Selesai). Pengaju bebas mengajukan lagi.
//  - "revisi_lagi"-> kembali ke "diminta revisi" (catatan WAJIB agar pengaju
//                    tahu apa yang masih salah). Pengaju tetap belum bisa
//                    mengajukan kegiatan baru.
//
// Penulisan lewat service role SETELAH pengecekan role di kode (pola yang sama
// dengan upload dokumentasi): policy RLS/trigger asisten yang hanya mengizinkan
// completed true->false tidak perlu diubah. Update dikunci dengan kondisi
// state di klausa WHERE supaya dua petugas yang menekan bersamaan tidak saling
// menimpa.
export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const session = await getSession();
  const token = await getSessionToken();

  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }
  if (!canRequestRevision(session.appRole)) {
    return NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  const catatan: string = typeof body?.catatan === "string" ? body.catatan.trim() : "";

  if (action !== "acc" && action !== "revisi_lagi") {
    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  }
  if (action === "revisi_lagi" && !catatan) {
    return NextResponse.json(
      { error: "Mohon isi catatan: bagian mana yang masih perlu diperbaiki pengaju." },
      { status: 400 }
    );
  }

  const db = supabaseServer();

  const { data: row, error: fetchError } = await db
    .from("practicum_requests")
    .select("id, status, completed, completed_at, revisi_diajukan_at")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }
  if (row.status !== "approved" || row.completed || !row.completed_at || !row.revisi_diajukan_at) {
    return NextResponse.json(
      { error: "Tidak ada revisi yang menunggu verifikasi pada pengajuan ini." },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    revisi_diajukan_at: null,
    revisi_diverifikasi_at: now,
    revisi_diverifikasi_by: session.usersId,
  };
  if (action === "acc") {
    update.completed = true;
    update.catatan_admin = catatan ? `[Revisi disetujui] ${catatan}` : null;
  } else {
    update.completed = false;
    update.catatan_admin = `[Revisi diminta] ${catatan}`;
  }

  const { data, error } = await db
    .from("practicum_requests")
    .update(update)
    .eq("id", params.id)
    .eq("completed", false)
    .not("revisi_diajukan_at", "is", null)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Verifikasi revisi error", error);
    return NextResponse.json({ error: "Gagal menyimpan hasil verifikasi." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Status pengajuan sudah berubah (mungkin sudah diverifikasi petugas lain). Muat ulang halaman." },
      { status: 409 }
    );
  }

  return NextResponse.json({ data });
}
