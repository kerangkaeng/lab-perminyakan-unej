import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { DOCS_BUCKET, docStoragePath } from "@/lib/supabase/storage";

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
  if (!isOwner && session.appRole !== "admin") {
    return NextResponse.json({ error: "Kamu tidak berhak mengunggah dokumentasi ini." }, { status: 403 });
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

  const { error: uploadError } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });

  if (uploadError) {
    console.error("Upload dokumentasi error", uploadError);
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
// oleh mahasiswa pemilik pengajuan maupun admin.
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
  if (!isOwner && session.appRole !== "admin") {
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
    const { data: signedUrls } = await supabase.storage.from(DOCS_BUCKET).createSignedUrls(paths, 3600);
    signed[cat] = (signedUrls ?? []).map((s, i) => ({ path: paths[i], url: s.signedUrl }));
  }

  return NextResponse.json({ data: signed });
}
