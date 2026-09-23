import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminRequestsTable } from "@/components/dashboard/AdminRequestsTable";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { canManagePracticumRequests } from "@/lib/admin/permissions";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";

export const revalidate = 0;

export default async function AdminPracticumRequestsPage() {
  const session = await getSession();
  const token = getSessionToken();
  const canManage = session ? canManagePracticumRequests(session.appRole) : false;
  let requests: PracticumRequest[] = [];
  let loadError: string | null = null;

  if (token) {
    const supabase = supabaseAuthed(token);
    // `requester:users!requester_id(...)` menghindari ambiguitas embed,
    // karena practicum_requests punya dua foreign key ke users
    // (requester_id dan reviewed_by).
    const { data, error } = await supabase
      .from("practicum_requests")
      .select("*, requester:users!requester_id(nama, nim, prodi)")
      .order("created_at", { ascending: false });

    if (error) {
      loadError = "Gagal memuat data pengajuan.";
    } else {
      requests = (data as unknown as PracticumRequest[]) ?? [];
    }
  }

  return (
    <DashboardShell title={canManage ? "Kelola Pengajuan Praktikum" : "Status Pengajuan Praktikum"}>
      {loadError && <p className="text-sm text-red-700 mb-6">{loadError}</p>}
      <AdminRequestsTable requests={requests} canManage={canManage} />
    </DashboardShell>
  );
}
