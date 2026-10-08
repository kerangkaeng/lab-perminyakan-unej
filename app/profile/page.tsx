import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import type { AppRole } from "@/lib/auth/session";

export const revalidate = 0;

// Base URL foto profil SISTER — cas:foto cuma ngasih path relatif
// (mis. "images/foto/221910801047.JPG"), digabung di sini jadi URL penuh.
const SISTER_PHOTO_BASE_URL = "https://sister.unej.ac.id/";

function buildFotoUrl(path: string | null): string | null {
  if (!path) return null;
  return `${SISTER_PHOTO_BASE_URL}${path.replace(/^\/+/, "")}`;
}

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
  const token = getSessionToken();

  let user: UserRow | null = null;
  let loadError: string | null = null;

  if (session && token) {
    const supabase = supabaseAuthed(token);
    const { data, error } = await supabase
      .from("users")
      .select("nama, nim, nip, prodi, user_type, role, identifier, email, fakultas, foto")
      .eq("id", session.usersId)
      .single();

    if (error) {
      loadError = "Gagal memuat data profil.";
    } else {
      user = data as UserRow;
    }
  }

  const fotoUrl = buildFotoUrl(user?.foto ?? null);

  return (
    <DashboardShell title="Profil Saya">
      {!session ? (
        <p className="text-core">Silakan login untuk melihat profil.</p>
      ) : loadError ? (
        <p className="text-sm text-red-700">{loadError}</p>
      ) : (
        <div className="max-w-lg">
          {fotoUrl && (
            <ProfilePhoto src={fotoUrl} alt={`Foto profil ${user?.nama ?? ""}`} />
          )}
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
          <ProfileField label="Identifier CAS" value={user?.identifier} />
        </div>
      )}
    </DashboardShell>
  );
}
