import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LabRolesManager, type Assignment, type ModuleLite } from "@/components/admin/LabRolesManager";

export const revalidate = 0;

export default async function LabRolesPage() {
  const session = await getSession();
  if (!session || session.appRole !== "admin") return notFound();

  const db = supabaseServer();
  const [rolesRes, modulesRes] = await Promise.all([
    db
      .from("lab_roles")
      .select("id, role_type, bidang, module_id, users!lab_roles_user_id_fkey(id, nama, nim, nip, user_type)")
      .order("created_at", { ascending: true }),
    db.from("practicum_modules").select("id, title").order("title", { ascending: true }),
  ]);

  const loadError = rolesRes.error
    ? "Gagal memuat jabatan. Pastikan migrasi 005_lab_roles.sql sudah dijalankan."
    : modulesRes.error
    ? "Gagal memuat daftar modul praktikum."
    : null;

  const assignments: Assignment[] = ((rolesRes.data ?? []) as any[])
    .map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users;
      return u
        ? ({ id: r.id, role_type: r.role_type, bidang: r.bidang, module_id: r.module_id, user: u } as Assignment)
        : null;
    })
    .filter((a): a is Assignment => !!a);

  const modules = (modulesRes.data ?? []) as ModuleLite[];

  return (
    <DashboardShell title="Jabatan Lab">
      {loadError ? (
        <p className="text-sm text-red-700">{loadError}</p>
      ) : (
        <LabRolesManager assignments={assignments} modules={modules} currentUserId={session.usersId} />
      )}
    </DashboardShell>
  );
}
