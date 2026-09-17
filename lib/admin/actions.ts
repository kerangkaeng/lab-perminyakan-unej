"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { uploadPublicFile, buildKey, deletePublicFile, keyFromProxyUrl } from "@/lib/storage/b2";
import { adminTables } from "./config";

async function uploadFile(file: File, table: string, fieldName: string): Promise<string> {
  const key = buildKey(`${table}/${fieldName}`, file.name);
  return uploadPublicFile(file, key);
}

/** Hapus file lama di B2 kalau field itu berisi URL proxy kita (/api/files/...). */
async function deleteOldFileIfAny(oldValue: unknown) {
  if (typeof oldValue !== "string" || !oldValue) return;
  const key = keyFromProxyUrl(oldValue);
  if (!key) return; // bukan URL B2 kita (mis. masih URL Supabase Storage lama) — biarkan, jangan dihapus
  try {
    await deletePublicFile(key);
  } catch {
    // Kegagalan hapus file lama tidak boleh menggagalkan simpan/hapus record —
    // paling buruk cuma jadi file "orphan" yang bisa dibersihkan manual nanti.
  }
}

export async function upsertRecord(tableName: string, id: string, formData: FormData) {
  const config = adminTables[tableName];
  if (!config) throw new Error("Tabel tidak dikenal");

  const supabase = supabaseServer();
  const isNew = id === "new";
  const record: Record<string, any> = {};

  // Ambil row lama (kalau edit) supaya file lama bisa dihapus dari B2 saat
  // ada upload baru yang menggantikannya di field yang sama.
  let existingRow: Record<string, any> | null = null;
  if (!isNew) {
    const { data } = await supabase.from(tableName).select("*").eq("id", id).single();
    existingRow = data ?? null;
  }

  for (const field of config.fields) {
    // Saat edit (bukan create), field id tidak pernah ikut ditulis ulang —
    // primary key tidak boleh berubah dan tidak ada di form saat edit.
    if (field.name === "id" && !isNew) continue;

    if (field.type === "image" || field.type === "pdf" || field.type === "file") {
      const file = formData.get(field.name) as File | null;
      if (file && file.size > 0) {
        record[field.name] = await uploadFile(file, tableName, field.name);
        if (existingRow) await deleteOldFileIfAny(existingRow[field.name]);
      } else {
        const existing = formData.get(`${field.name}__existing`);
        if (existing) record[field.name] = existing as string;
      }
    } else if (field.type === "checkbox") {
      record[field.name] = formData.get(field.name) === "on";
    } else if (field.type === "tags") {
      const raw = (formData.get(field.name) as string) ?? "";
      record[field.name] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (field.type === "number") {
      const raw = formData.get(field.name);
      record[field.name] = raw ? Number(raw) : null;
    } else if (field.type === "relation") {
      const raw = formData.get(field.name);
      record[field.name] = raw && raw !== "" ? raw : null;
    } else {
      const raw = formData.get(field.name);
      record[field.name] = raw && raw !== "" ? raw : null;
    }
  }

  if (isNew) {
    const { error } = await supabase.from(tableName).insert(record);
    if (error) throw new Error(`Gagal menyimpan: ${error.message}`);
  } else {
    const { error } = await supabase.from(tableName).update(record).eq("id", id);
    if (error) throw new Error(`Gagal menyimpan: ${error.message}`);
  }

  revalidatePath(`/admin/${tableName}`);
  revalidatePath(`/admin/${tableName}/${encodeURIComponent(id)}`);
  redirect(`/admin/${tableName}`);
}

export async function deleteRecord(tableName: string, id: string) {
  const config = adminTables[tableName];
  if (!config) throw new Error("Tabel tidak dikenal");
  const supabase = supabaseServer();

  // Ambil dulu row-nya supaya file (image/pdf/file) yang menempel ikut
  // dihapus dari B2 — bukan cuma baris database-nya.
  const fileFields = config.fields.filter((f) => ["image", "pdf", "file"].includes(f.type));
  if (fileFields.length > 0) {
    const { data: row } = await supabase.from(tableName).select("*").eq("id", id).single();
    if (row) {
      for (const field of fileFields) {
        await deleteOldFileIfAny(row[field.name]);
      }
    }
  }

  const { error } = await supabase.from(tableName).delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus: ${error.message}`);
  revalidatePath(`/admin/${tableName}`);
}
