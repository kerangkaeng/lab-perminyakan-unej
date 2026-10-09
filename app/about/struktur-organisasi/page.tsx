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

// FALLBACK saja. Penempatan praktikum sekarang otomatis lewat
// practicum_modules.facility_id -> facilities.bidang (diatur admin di menu
// Facilities & Modul Praktikum). Daftar kata kunci ini hanya dipakai kalau
// lab modul itu belum punya bidang, atau migrasi 006 belum dijalankan —
// supaya praktikum lama tidak tiba-tiba hilang dari bagan.
const LEGACY_KEYWORDS: Record<Bidang, string[]> = {
  pemboran_produksi: ["pemboran"],
  reservoir: ["sedimentologi", "fluida reservoir", "petrofisik"],
};

type ModuleRow = { id: string; title: string; facility_id?: string | null; urutan?: number | null };

function legacyIndex(title: string, bidang: Bidang): number {
  const t = title.toLowerCase();
  const i = LEGACY_KEYWORDS[bidang].findIndex((kw) => t.includes(kw));
  return i === -1 ? 999 : i;
}

function legacyBidang(title: string): Bidang | null {
  return BIDANG_VALUES.find((b) => legacyIndex(title, b) !== 999) ?? null;
}

export default async function StrukturOrganisasiPage() {
  const db = supabaseServer();

  const rolesPromise = db
    .from("lab_roles")
    .select("role_type, bidang, module_id, users!lab_roles_user_id_fkey(id, nama, nim, nip, foto)")
    .neq("role_type", "admin")
    .order("created_at", { ascending: true });

  // Coba kolom baru (migrasi 006). Kalau belum ada, ulangi dengan kolom lama.
  let [modulesRes, facilitiesRes] = await Promise.all([
    db.from("practicum_modules").select("id, title, facility_id, urutan").eq("status", "published"),
    db.from("facilities").select("id, bidang"),
  ]);
  if (modulesRes.error || facilitiesRes.error) {
    modulesRes = (await db.from("practicum_modules").select("id, title").eq("status", "published")) as typeof modulesRes;
    facilitiesRes = { data: [], error: null } as unknown as typeof facilitiesRes;
  }
  const rolesRes = await rolesPromise;

  const failed = !!rolesRes.error || !!modulesRes.error;
  const rows = ((rolesRes.data ?? []) as unknown as Row[]).filter((r) => r.users);

  const holder = (type: string, bidang: Bidang): OrgPerson | null => {
    const r = rows.find((x) => x.role_type === type && x.bidang === bidang);
    return r ? toPerson(r.users!) : null;
  };

  const bidangOfFacility = new Map<string, Bidang>();
  for (const f of (facilitiesRes.data ?? []) as { id: string; bidang: string | null }[]) {
    if (f.bidang && (BIDANG_VALUES as readonly string[]).includes(f.bidang)) {
      bidangOfFacility.set(f.id, f.bidang as Bidang);
    }
  }

  // Tentukan lab tiap modul: dari facility.bidang; kalau kosong, fallback kata kunci judul.
  const modules = (modulesRes.data ?? []) as ModuleRow[];
  const byBidang = new Map<Bidang, ModuleRow[]>(BIDANG_VALUES.map((b) => [b, []]));
  for (const m of modules) {
    const b = (m.facility_id ? bidangOfFacility.get(m.facility_id) : undefined) ?? legacyBidang(m.title);
    if (b) byBidang.get(b)!.push(m);
    else console.warn(`Struktur Organisasi: modul "${m.title}" belum terhubung ke lab (isi Bidang pada Facilities).`);
  }

  const toPraktikum = (m: ModuleRow): PraktikumUnit => ({
    id: m.id,
    title: m.title,
    dosen: rows.filter((r) => r.role_type === "dosen_mk" && r.module_id === m.id).map((r) => toPerson(r.users!)),
    asisten: rows.filter((r) => r.role_type === "asisten" && r.module_id === m.id).map((r) => toPerson(r.users!)),
  });

  const labs: LabUnit[] = BIDANG_VALUES.map((b) => {
    // Urutan: kolom "urutan" (kecil dulu, kosong di akhir) -> urutan kata kunci lama -> abjad.
    const praktikum = [...byBidang.get(b)!]
      .sort(
        (x, y) =>
          (x.urutan ?? 9999) - (y.urutan ?? 9999) ||
          legacyIndex(x.title, b) - legacyIndex(y.title, b) ||
          x.title.localeCompare(y.title, "id")
      )
      .map(toPraktikum);
    return { key: b, name: BIDANG_LABEL[b], kepala: holder("kepala_lab", b), laboran: holder("laboran", b), praktikum };
  });

  const peneliti = rows.filter((r) => r.role_type === "dosen_peneliti").map((r) => toPerson(r.users!));

  return (
    <div className="py-16">
      <div className="container-lab">
        <p className="eyebrow mb-3">Tentang Kami</p>
        <h1 className="mb-12 text-3xl font-display font-semibold md:text-4xl">Struktur Organisasi</h1>
      </div>
      <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-10">
        {failed ? (
          <p className="text-sm text-red-700">Gagal memuat struktur organisasi. Coba lagi beberapa saat.</p>
        ) : (
          <OrgChart labs={labs} peneliti={peneliti} />
        )}
      </div>
    </div>
  );
}
