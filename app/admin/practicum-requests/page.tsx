import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminRequestsTable } from "@/components/dashboard/AdminRequestsTable";
import { RequestsFilterBar } from "@/components/dashboard/RequestsFilterBar";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { canManagePracticumRequests, canRequestRevision } from "@/lib/admin/permissions";
import { supabaseAuthed, supabasePublic } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { filterAndSortRequests, type SortDirection } from "@/lib/admin/requestFilters";

export const revalidate = 0;

type SearchParams = {
  jenis?: string;
  lab?: string;
  status?: string;
  urutan?: string;
};

export default async function AdminPracticumRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const token = getSessionToken();
  const canManage = session ? canManagePracticumRequests(session.appRole) : false;
  const canRevise = session ? canRequestRevision(session.appRole) : false;
  // Tombol download rekap Excel sengaja admin-only (lihat catatan di
  // app/api/admin/practicum-requests/recap/route.ts) — lebih ketat dari
  // canManage/canRevise yang juga meloloskan asisten.
  const canDownloadRecap = session?.appRole === "admin";

  const jenisFilter = searchParams.jenis ?? "all";
  const labFilter = searchParams.lab ?? "all";
  const statusFilter = searchParams.status ?? "all";
  const urutan: SortDirection = searchParams.urutan === "asc" ? "asc" : "desc";

  let requests: PracticumRequest[] = [];
  let loadError: string | null = null;

  if (token) {
    const supabase = supabaseAuthed(token);
    // `requester:users!requester_id(...)` menghindari ambiguitas embed,
    // karena practicum_requests punya dua foreign key ke users
    // (requester_id dan reviewed_by).
    //
    // Filter & sort di sini SENGAJA dilakukan di JavaScript (bukan lewat
    // query builder Supabase) karena kategori status turunan (lihat
    // lib/admin/requestFilters.ts) butuh bandingkan beberapa kolom +
    // tanggal hari ini, bukan nilai kolom mentah — lebih jelas & gampang
    // dirawat sebagai fungsi biasa daripada query filter bertingkat.
    // Untuk skala jumlah pengajuan lab kampus, ambil semua lalu filter
    // di memori ini tidak masalah dari sisi performa.
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

  const filtered = filterAndSortRequests(requests, {
    jenis: jenisFilter,
    lab: labFilter,
    status: statusFilter,
    urutan,
  });

  // Daftar laboratorium untuk dropdown filter — diambil dari tabel
  // facilities (bukan cuma nilai unik yang ada di data pengajuan saat
  // ini), supaya tetap konsisten dengan daftar lab resmi yang dipakai di
  // form "Ajukan Kegiatan" (lihat app/practicum/ajukan/page.tsx).
  const supabasePublicClient = supabasePublic();
  const { data: facilitiesData } = await supabasePublicClient
    .from("facilities")
    .select("name")
    .eq("status", "published")
    .order("name");
  const labNames = (facilitiesData ?? []).map((f: { name: string }) => f.name);

  return (
    <DashboardShell title={canManage ? "Kelola Pengajuan Praktikum" : "Status Pengajuan Praktikum"}>
      {loadError && <p className="text-sm text-red-700 mb-6">{loadError}</p>}
      <RequestsFilterBar labs={labNames} canDownloadRecap={canDownloadRecap} />
      {filtered.length === 0 && requests.length > 0 ? (
        <p className="text-core text-sm">Tidak ada pengajuan yang cocok dengan filter ini.</p>
      ) : (
        <AdminRequestsTable requests={filtered} canManage={canManage} canRequestRevision={canRevise} />
      )}
    </DashboardShell>
  );
}
