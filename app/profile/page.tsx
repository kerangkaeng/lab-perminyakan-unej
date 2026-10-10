import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import type { AppRole } from "@/lib/auth/session";
import { isProfilePhotoKey, profilePhotoUrl } from "@/lib/storage/b2";
import { supabaseServer } from "@/lib/supabase/server";
import { describeLabRole, type LabRoleType } from "@/lib/lab-roles";

export const revalidate = 0;

interface UserRow {
  nama: string;
  nim: string | null;
  nip: string | null;
  prodi: string | null;
  user_type: string | null;
  role: AppRole;
  identifier: string;
  email: string | null;
  fakultas: string | null;
  foto: string | null;
  cas_attributes: Record<string, string[]> | null;
}

const ROLE_LABEL: Record<AppRole, string> = {
  mahasiswa: "Mahasiswa",
  admin: "Admin",
  asisten: "Asisten",
  dosen: "Dosen",
};

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-line py-3">
      <p className="text-xs font-mono uppercase text-core">{label}</p>
      <p className="mt-1 text-ink">{value || "—"}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  const token = await getSessionToken();

  let user: UserRow | null = null;
  let loadError: string | null = null;

  if (session && token) {
    const supabase = supabaseAuthed(token);
    const baseColumns = "nama, nim, nip, prodi, user_type, role, identifier, email, fakultas, foto";
    // Atribut mentah SSO hanya diminta untuk admin (dipakai sebagai alat
    // diagnosa pemetaan atribut). Kalau migrasi 003 belum dijalankan,
    // fallback ke kolom dasar supaya profil tetap tampil.
    let { data, error } = await supabase
      .from("users")
      .select(session.appRole === "admin" ? `${baseColumns}, cas_attributes` : baseColumns)
      .eq("id", session.usersId)
      .single();
    if (error && session.appRole === "admin") {
      ({ data, error } = await supabase.from("users").select(baseColumns).eq("id", session.usersId).single());
    }

    if (error) {
      loadError = "Gagal memuat data profil.";
    } else {
      user = data as unknown as UserRow;
    }
  }

  // Foto diunggah sendiri oleh user (bucket privat), disajikan lewat
  // /api/profile/photo. Nilai lama dari SSO diabaikan.
  const fotoUrl =
    session && isProfilePhotoKey(user?.foto, session.usersId) ? profilePhotoUrl(user!.foto!) : null;

  // Jabatan Lab yang dipegang user ini (ditetapkan admin).
  let jabatan: string[] = [];
  if (session) {
    const { data: rows } = await supabaseServer()
      .from("lab_roles")
      .select("role_type, bidang, practicum_modules(title)")
      .eq("user_id", session.usersId);
    jabatan = ((rows ?? []) as any[]).map((r) =>
      describeLabRole(r.role_type as LabRoleType, r.bidang, r.practicum_modules?.title ?? null)
    );
  }

  return (
    <DashboardShell title="Profil Saya">
      {!session ? (
        <p className="text-core">Silakan login untuk melihat profil.</p>
      ) : loadError ? (
        <p className="text-sm text-red-700">{loadError}</p>
      ) : (
        <div className="max-w-lg">
          <ProfilePhoto src={fotoUrl} name={user?.nama ?? session.nama} />
          <ProfileField label="Nama" value={user?.nama} />
          <ProfileField
            label={user?.nim ? "NIM" : "NIP"}
            value={user?.nim ?? user?.nip}
          />
          <ProfileField label="Program Studi / Unit Kerja" value={user?.prodi} />
          <ProfileField label="Fakultas" value={user?.fakultas} />
          <ProfileField label="Email SISTER" value={user?.email} />
          <ProfileField label="Status (SISTER)" value={user?.user_type} />
          <ProfileField
            label="Role Akses"
            value={user?.role ? ROLE_LABEL[user.role] : undefined}
          />
          <div className="border-b border-line py-3">
            <p className="text-xs font-mono uppercase text-core">Jabatan Lab</p>
            {jabatan.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-ink">
                {jabatan.map((j) => (
                  <li key={j}>{j}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-ink">—</p>
            )}
          </div>
          <ProfileField label="Identifier CAS" value={user?.identifier} />

          {session.appRole === "admin" && (
            <details className="mt-8 border border-line p-4">
              <summary className="cursor-pointer text-xs font-mono uppercase text-core">
                Atribut mentah SSO (khusus admin)
              </summary>
              {user?.cas_attributes ? (
                <>
                  <p className="mt-3 text-xs text-core">
                    Isi apa adanya yang dikirim CAS pada login terakhir. Pakai ini untuk memastikan
                    nama atribut yang sebenarnya.
                  </p>
                  <pre className="mt-3 overflow-x-auto bg-mist p-3 text-xs">
                    {JSON.stringify(user.cas_attributes, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="mt-3 text-xs text-core">
                  Belum ada data. Jalankan migrasi 003, lalu logout dan login ulang.
                </p>
              )}
            </details>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
