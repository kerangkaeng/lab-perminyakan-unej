import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function StatusPengajuanPage() {
  const session = await getSession();
  const token = getSessionToken();

  let requests: PracticumRequest[] = [];
  let loadError: string | null = null;

  if (session && token) {
    const supabase = supabaseAuthed(token);
    const { data, error } = await supabase
      .from("practicum_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      loadError = "Gagal memuat data pengajuan.";
    } else {
      requests = (data as PracticumRequest[]) ?? [];
    }
  }

  return (
    <DashboardShell title="Status Pengajuan">
      {loadError && <p className="text-sm text-red-700 mb-6">{loadError}</p>}

      {!loadError && requests.length === 0 && (
        <p className="text-core text-sm">
          Belum ada pengajuan praktikum. Buat pengajuan baru lewat menu &ldquo;Ajukan Praktikum&rdquo;.
        </p>
      )}

      {requests.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
                <th className="text-left p-4">Praktikum</th>
                <th className="text-left p-4">Modul</th>
                <th className="text-left p-4">Jadwal</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="p-4 text-ink font-medium">{r.praktikum_nama}</td>
                  <td className="p-4 text-core">{r.modul}</td>
                  <td className="p-4 text-core font-mono whitespace-nowrap">
                    {formatDate(r.tanggal)}
                    <br />
                    {r.jam_mulai}–{r.jam_selesai}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-4 text-core">{r.catatan_admin || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
