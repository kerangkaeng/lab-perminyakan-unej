import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminRequestsTable } from "@/components/dashboard/AdminRequestsTable";
import { RequestsFilterBar } from "@/components/dashboard/RequestsFilterBar";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { canManagePracticumRequests, canRequestRevision } from "@/lib/admin/permissions";
import { supabaseAuthed, supabasePublic } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";

export const revalidate = 0;

type SearchParams = {
  jenis?: string;
  lab?: string;
  status?: string;
  urutan?: string;
};

// Status pengajuan di sini BUKAN langsung kolom `status` mentah — ini
// kategori turunan yang diminta: baru masuk (belum diaksi), sudah diaksi
// (approve/reject), selesai administrasi, dan "kegiatan sudah lewat
// tanggal tapi administrasi belum diselesaikan" (dihitung dari `tanggal`
// dibanding hari ini).
function matchesStatusFilter(r: PracticumRequest, filter: string): boolean {
  if (filter === "all") return true;

  if (filter === "pending") return r.status === "pending";
  if (filter === "acted") return r.status === "approved" || r.status === "rejected";
  if (filter === "admin_done") return r.status === "approved" && r.completed === true;

  if (filter === "activity_pending") {
    if (r.status !== "approved" || r.completed) return false;
    // Bandingkan cuma tanggalnya (bukan jam) — "kegiatan sudah lewat"
    // berarti tanggal kegiatan < hari ini.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tanggalKegiatan = new Date(r.tanggal);
    tanggalKegiatan.setHours(0, 0, 0, 0);
    return tanggalKegiatan < today;
  }

  return true;
}

export default async function AdminPracticumRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const token = getSessionToken();
  const canManage = session ? canManagePracticumRequests(session.appRole) : false;
  const canRevise = session ? canRequestRevision(session.appRole) : false;

  const jenisFilter = searchParams.jenis ?? "all";
  const labFilter = searchParams.lab ?? "all";
  const statusFilter = searchParams.status ?? "all";
  const urutan = searchParams.urutan === "asc" ? "asc" : "desc";

  let requests: PracticumRequest[] = [];
  let loadError: string | null = null;

  if (token) {
    const supabase = supabaseAuthed(token);
    // `requester:users!requester_id(...)` menghindari ambiguitas embed,
    // karena practicum_requests punya dua foreign key ke users
    // (requester_id dan reviewed_by).
    //
    // Filter & sort di sini SENGAJA dilakukan di JavaScript (bukan lewat
    // query builder Supabase) karena kategori status di atas adalah
    // turunan (butuh bandingkan beberapa kolom + tanggal hari ini), bukan
    // nilai kolom mentah — lebih jelas & gampang dirawat sebagai fungsi
    // biasa daripada query filter bertingkat. Untuk skala jumlah
    // pengajuan lab kampus, ambil semua lalu filter di memori ini tidak
    // masalah dari sisi performa.
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

  const filtered = requests
    .filter((r) => jenisFilter === "all" || r.jenis_kegiatan === jenisFilter)
    .filter((r) => labFilter === "all" || r.lokasi === labFilter)
    .filter((r) => matchesStatusFilter(r, statusFilter))
    .sort((a, b) => {
      const diff = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      return urutan === "asc" ? diff : -diff;
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
      <RequestsFilterBar labs={labNames} />
      {filtered.length === 0 && requests.length > 0 ? (
        <p className="text-core text-sm">Tidak ada pengajuan yang cocok dengan filter ini.</p>
      ) : (
        <AdminRequestsTable requests={filtered} canManage={canManage} canRequestRevision={canRevise} />
      )}
    </DashboardShell>
  );
}
