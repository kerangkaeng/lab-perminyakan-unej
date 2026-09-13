"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { adminTables } from "./config";

async function uploadFile(file: File, table: string, fieldName: string): Promise<string> {
  const supabase = supabaseServer();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${table}/${fieldName}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("content-images").upload(path, file, { upsert: true });
  if (error) throw new Error(`Upload gagal: ${error.message}`);
  const { data } = supabase.storage.from("content-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function upsertRecord(tableName: string, id: string, formData: FormData) {
  const config = adminTables[tableName];
  if (!config) throw new Error("Tabel tidak dikenal");

  const supabase = supabaseServer();
  const isNew = id === "new";
  const record: Record<string, any> = {};

  for (const field of config.fields) {
    // Saat edit (bukan create), field id tidak pernah ikut ditulis ulang —
    // primary key tidak boleh berubah dan tidak ada di form saat edit.
    if (field.name === "id" && !isNew) continue;

    if (field.type === "image" || field.type === "pdf" || field.type === "file") {
      const file = formData.get(field.name) as File | null;
      if (file && file.size > 0) {
        record[field.name] = await uploadFile(file, tableName, field.name);
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
  const { error } = await supabase.from(tableName).delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus: ${error.message}`);
  revalidatePath(`/admin/${tableName}`);
}
