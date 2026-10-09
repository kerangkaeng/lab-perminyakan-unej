import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { validateLabRole, EXCLUSIVE_TYPES, LAB_ROLE_LABEL, type LabRoleType } from "@/lib/lab-roles";

// Pengelolaan Jabatan Lab — HANYA admin. Semua penulisan memakai service
// role + fungsi SQL assign_lab_role (atomik); hak akses users.role
// disinkronkan otomatis oleh trigger database.

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Kamu belum login." }, { status: 401 }) };
  if (session.appRole !== "admin") {
    return { error: NextResponse.json({ error: "Kamu tidak berhak melakukan aksi ini." }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const userId = body?.user_id;
  const roleType = body?.role_type as LabRoleType;
  const bidang = body?.bidang ?? null;
  const moduleId = body?.module_id ?? null;
  const replace = body?.replace === true;

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Pilih user terlebih dahulu." }, { status: 400 });
  }
  const invalid = validateLabRole(roleType, bidang, moduleId);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const db = supabaseServer();

  const { data: target } = await db.from("users").select("id, nama").eq("id", userId).maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  }
  if (moduleId) {
    const { data: mod } = await db.from("practicum_modules").select("id").eq("id", moduleId).maybeSingle();
    if (!mod) return NextResponse.json({ error: "Modul praktikum tidak ditemukan." }, { status: 404 });
  }

  const { data, error } = await db.rpc("assign_lab_role", {
    p_user: userId,
    p_type: roleType,
    p_bidang: bidang,
    p_module: moduleId,
    p_replace: replace,
    p_by: session!.usersId,
  });

  if (error) {
    if (error.message?.includes("SLOT_TAKEN")) {
      return NextResponse.json(
        { error: `${LAB_ROLE_LABEL[roleType]} untuk bidang ini sudah terisi. Konfirmasi penggantian dulu.` },
        { status: 409 }
      );
    }
    if (error.code === "23514") {
      return NextResponse.json({ error: "Kombinasi jabatan tidak valid." }, { status: 400 });
    }
    console.error("assign_lab_role error", error);
    return NextResponse.json({ error: "Gagal menyimpan jabatan." }, { status: 500 });
  }

  return NextResponse.json({ id: data, exclusive: EXCLUSIVE_TYPES.includes(roleType) });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { session } = auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID jabatan tidak valid." }, { status: 400 });

  const db = supabaseServer();
  const { data: row } = await db.from("lab_roles").select("id, user_id, role_type").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Jabatan tidak ditemukan." }, { status: 404 });

  // Cegah admin mengunci dirinya sendiri keluar.
  if (row.role_type === "admin" && row.user_id === session!.usersId) {
    return NextResponse.json(
      { error: "Kamu tidak bisa mencopot akses Administrator milikmu sendiri. Minta admin lain melakukannya." },
      { status: 400 }
    );
  }

  const { error } = await db.from("lab_roles").delete().eq("id", id);
  if (error) {
    console.error("Hapus lab_role error", error);
    return NextResponse.json({ error: "Gagal mencopot jabatan." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
