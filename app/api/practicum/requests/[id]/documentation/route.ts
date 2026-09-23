import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { docStoragePath } from "@/lib/supabase/storage";
import { uploadPrivateFile, getPrivateSignedUrls } from "@/lib/storage/b2";

const ALLOWED_CATEGORIES = [
  "doc_pretest",
  "doc_tes_alat",
  "doc_praktikum",
  "doc_kegiatan",
  "insiden_dokumentasi",
] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

// Kategori dokumentasi yang valid per jenis kegiatan
const VALID_FOR_JENIS: Record<string, Category[]> = {
  praktikum: ["doc_pretest", "doc_tes_alat", "doc_praktikum", "insiden_dokumentasi"],
  non_praktikum: ["doc_kegiatan", "insiden_dokumentasi"],
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const category = form?.get("category");

  if (
    !(file instanceof File) ||
    typeof category !== "string" ||
    !ALLOWED_CATEGORIES.includes(category as Category)
  ) {
    return NextResponse.json({ error: "Berkas atau kategori dokumentasi tidak valid." }, { status: 400 });
  }

  const supabase = supabaseAuthed(token);

  const { data: reqRow, error: fetchError } = await supabase
    .from("practicum_requests")
    .select(
      "id, requester_id, jenis_kegiatan, status, completed, doc_pretest, doc_tes_alat, doc_praktikum, doc_kegiatan, insiden_dokumentasi"
    )
    .eq("id", params.id)
    .single();

  if (fetchError || !reqRow) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }

  const isOwner = reqRow.requester_id === session.usersId;
  const canView = isOwner || session.appRole === "admin" || session.appRole === "asisten";
  if (!canView) {
    return NextResponse.json({ error: "Kamu tidak berhak melihat dokumentasi ini." }, { status: 403 });
  }
  if (reqRow.status !== "approved") {
    return NextResponse.json({ error: "Pengajuan belum disetujui admin." }, { status: 400 });
  }
  if (reqRow.completed) {
    return NextResponse.json({ error: "Administrasi kegiatan ini sudah ditandai selesai." }, { status: 400 });
  }
  if (!VALID_FOR_JENIS[reqRow.jenis_kegiatan]?.includes(category as Category)) {
    return NextResponse.json({ error: "Kategori dokumentasi tidak sesuai jenis kegiatan." }, { status: 400 });
  }

  const path = docStoragePath(params.id, category, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await uploadPrivateFile(buffer, path, file.type || "application/octet-stream");
  } catch (e) {
    console.error("Upload dokumentasi error", e);
    return NextResponse.json({ error: "Gagal mengunggah berkas." }, { status: 500 });
  }

  const currentList: string[] = (reqRow as any)[category] ?? [];
  const updatedList = [...currentList, path];

  const { data: updated, error: updateError } = await supabase
    .from("practicum_requests")
    .update({ [category]: updatedList })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    console.error("Update referensi dokumentasi error", updateError);
    return NextResponse.json(
      { error: "Berkas terunggah, tapi gagal menyimpan referensinya." },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: updated, path });
}

// Dipakai untuk menampilkan pratinjau (signed URL, karena bucket privat) —
// oleh mahasiswa pemilik pengajuan maupun admin. Juga dipakai oleh
// CompletionModal untuk PREFILL form saat merevisi administrasi yang
// sebelumnya sudah diisi (lihat `requestData` di response) — makanya
// route ini sengaja select("*") dan meneruskan field mentahnya, bukan
// cuma signed URL berkas.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  const token = getSessionToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Kamu belum login." }, { status: 401 });
  }

  const supabase = supabaseAuthed(token);
  const { data: reqRow, error } = await supabase
    .from("practicum_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !reqRow) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan." }, { status: 404 });
  }

  const isOwner = reqRow.requester_id === session.usersId;
  const canView = isOwner || session.appRole === "admin" || session.appRole === "asisten";
  if (!canView) {
    return NextResponse.json({ error: "Kamu tidak berhak melihat dokumentasi ini." }, { status: 403 });
  }

  const categories: Category[] = [
    "doc_pretest",
    "doc_tes_alat",
    "doc_praktikum",
    "doc_kegiatan",
    "insiden_dokumentasi",
  ];

  const signed: Record<string, { path: string; url: string }[]> = {};

  for (const cat of categories) {
    const paths: string[] = (reqRow as any)[cat] ?? [];
    if (paths.length === 0) continue;
    const signedUrls = await getPrivateSignedUrls(paths, 3600);
    signed[cat] = signedUrls
      .map((s) => ({ path: s.key, url: s.url }))
      .filter((s): s is { path: string; url: string } => !!s.url);
  }

  // Resolusi nama alat/bahan dari equipment_id. Item peminjaman lama bisa
  // saja tidak menyimpan equipment_name (atau kosong), jadi kita selalu
  // ambil ulang dari tabel equipment supaya nama yang tampil pasti akurat.
  const equipmentIds = new Set<string>();
  for (const item of ((reqRow as any).peminjaman_alat ?? []) as { equipment_id: string }[]) {
    if (item?.equipment_id) equipmentIds.add(item.equipment_id);
  }
  for (const item of ((reqRow as any).peminjaman_bahan ?? []) as { equipment_id: string }[]) {
    if (item?.equipment_id) equipmentIds.add(item.equipment_id);
  }

  const equipmentNames: Record<string, string> = {};
  if (equipmentIds.size > 0) {
    const { data: equipRows } = await supabase
      .from("equipment")
      .select("id, name")
      .in("id", Array.from(equipmentIds));
    for (const row of (equipRows as { id: string; name: string }[]) ?? []) {
      equipmentNames[row.id] = row.name;
    }
  }

  // Field mentah yang dibutuhkan CompletionModal untuk prefill form saat
  // revisi. Sengaja whitelist manual (bukan spread seluruh reqRow) supaya
  // field sensitif/tidak relevan (mis. requester_id) tidak ikut terekspos
  // ke response ini.
  const requestData = {
    completed_at: (reqRow as any).completed_at ?? null,
    ada_insiden: (reqRow as any).ada_insiden ?? false,
    insiden_jenis: (reqRow as any).insiden_jenis ?? null,
    insiden_jenis_lainnya: (reqRow as any).insiden_jenis_lainnya ?? null,
    insiden_nama_alat: (reqRow as any).insiden_nama_alat ?? null,
    insiden_jumlah: (reqRow as any).insiden_jumlah ?? null,
    insiden_penyebab: (reqRow as any).insiden_penyebab ?? null,
    insiden_pihak_terkait: (reqRow as any).insiden_pihak_terkait ?? null,
    insiden_tanggung_jawab: (reqRow as any).insiden_tanggung_jawab ?? null,
    ada_peminjaman: (reqRow as any).ada_peminjaman ?? false,
    pinjam_alat: (reqRow as any).pinjam_alat ?? null,
    pinjam_bahan: (reqRow as any).pinjam_bahan ?? null,
    peminjaman_alat: (reqRow as any).peminjaman_alat ?? null,
    peminjaman_bahan: (reqRow as any).peminjaman_bahan ?? null,
  };

  return NextResponse.json({ data: signed, equipmentNames, requestData });
}
