import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const revalidate = 0;

interface UserRow {
  nama: string;
  nim: string | null;
  nip: string | null;
  prodi: string | null;
  user_type: string | null;
  role: "mahasiswa" | "admin";
  identifier: string;
}

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
      .select("nama, nim, nip, prodi, user_type, role, identifier")
      .eq("id", session.usersId)
      .single();

    if (error) {
      loadError = "Gagal memuat data profil.";
    } else {
      user = data as UserRow;
    }
  }

  return (
    <DashboardShell title="Profil Saya">
      {!session ? (
        <p className="text-core">Silakan login untuk melihat profil.</p>
      ) : loadError ? (
        <p className="text-sm text-red-700">{loadError}</p>
      ) : (
        <div className="max-w-lg">
          <ProfileField label="Nama" value={user?.nama} />
          <ProfileField
            label={user?.nim ? "NIM" : "NIP"}
            value={user?.nim ?? user?.nip}
          />
          <ProfileField label="Program Studi" value={user?.prodi} />
          <ProfileField label="Status (SISTER)" value={user?.user_type} />
          <ProfileField
            label="Role Akses"
            value={user?.role === "admin" ? "Admin" : "Mahasiswa"}
          />
          <ProfileField label="Identifier CAS" value={user?.identifier} />
        </div>
      )}
    </DashboardShell>
  );
}
