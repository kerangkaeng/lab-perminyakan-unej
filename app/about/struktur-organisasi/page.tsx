import { supabaseServer } from "@/lib/supabase/server";
import { BIDANG_LABEL, BIDANG_VALUES, type Bidang } from "@/lib/lab-roles";
import { OrgChart, type LabUnit, type PraktikumUnit } from "@/components/about/OrgChart";
import type { OrgPerson } from "@/components/about/PersonCard";
import { isProfilePhotoKey } from "@/lib/storage/b2";

export const revalidate = 0;

type UserRow = { id: string; nama: string; nim: string | null; nip: string | null; foto: string | null };
type Row = {
  role_type: string;
  bidang: string | null;
  module_id: string | null;
  users: UserRow | UserRow[] | null;
};

function toPerson(u: NonNullable<Row["users"]>): OrgPerson {
  const user = Array.isArray(u) ? u[0] : u;
  const hasPhoto = isProfilePhotoKey(user.foto, user.id);
  return {
    id: user.id,
    nama: user.nama,
    ident: user.nim ?? user.nip ?? null,
    photo: hasPhoto
      ? `/api/public/staff-photo/${user.id}?v=${encodeURIComponent(user.foto!.split("/").pop() ?? "")}`
      : null,
  };
}

export default async function StrukturOrganisasiPage() {
  const db = supabaseServer();
  const [rolesRes, modulesRes] = await Promise.all([
    db
      .from("lab_roles")
      .select("role_type, bidang, module_id, users!lab_roles_user_id_fkey(id, nama, nim, nip, foto)")
      .neq("role_type", "admin")
      .order("created_at", { ascending: true }),
    db.from("practicum_modules").select("id, title").eq("status", "published").order("title", { ascending: true }),
  ]);

  const failed = !!rolesRes.error || !!modulesRes.error;
  const rows = ((rolesRes.data ?? []) as unknown as Row[]).filter((r) => r.users);

  const holder = (type: string, bidang: Bidang): OrgPerson | null => {
    const r = rows.find((x) => x.role_type === type && x.bidang === bidang);
    return r ? toPerson(r.users!) : null;
  };

  const labs: LabUnit[] = BIDANG_VALUES.map((b) => ({
    key: b,
    name: BIDANG_LABEL[b],
    kepala: holder("kepala_lab", b),
    laboran: holder("laboran", b),
  }));

  const praktikum: PraktikumUnit[] = ((modulesRes.data ?? []) as { id: string; title: string }[]).map((m) => ({
    id: m.id,
    title: m.title,
    dosen: rows.filter((r) => r.role_type === "dosen_mk" && r.module_id === m.id).map((r) => toPerson(r.users!)),
    asisten: rows.filter((r) => r.role_type === "asisten" && r.module_id === m.id).map((r) => toPerson(r.users!)),
  }));

  const peneliti = rows.filter((r) => r.role_type === "dosen_peneliti").map((r) => toPerson(r.users!));

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Tentang Kami</p>
      <h1 className="mb-2 text-3xl font-display font-semibold md:text-4xl">Struktur Organisasi</h1>
      <p className="mb-12 max-w-2xl text-sm text-core">
        Susunan pengelola Laboratorium Teknik Perminyakan. Klik nama untuk melihat foto.
      </p>
      {failed ? (
        <p className="text-sm text-red-700">Gagal memuat struktur organisasi. Coba lagi beberapa saat.</p>
      ) : (
        <OrgChart labs={labs} praktikum={praktikum} peneliti={peneliti} />
      )}
    </div>
  );
}
