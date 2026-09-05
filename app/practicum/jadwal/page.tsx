import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabasePublic } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { nonPraktikumLabel } from "@/lib/constants/kegiatan";

// Jadwal disetujui bersifat publik (policy RLS requests_select_approved_public
// untuk role anon), jadi halaman ini sengaja TIDAK diproteksi middleware —
// siapapun boleh melihatnya, termasuk yang belum login.
export const revalidate = 0;

export default async function JadwalPage() {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("practicum_requests")
    .select(
      "id, jenis_kegiatan, praktikum_nama, modul, kegiatan_non_praktikum, deskripsi_lainnya, tanggal, jam_mulai, jam_selesai, lokasi, status"
    )
    .eq("status", "approved")
    .order("tanggal", { ascending: true });

  const jadwal = (data as PracticumRequest[]) ?? [];

  return (
    <DashboardShell title="Jadwal Kegiatan">
      <p className="text-core mb-8 max-w-xl">
        Jadwal kegiatan praktikum dan non-praktikum yang sudah disetujui admin laboratorium.
      </p>

      {error && <p className="text-sm text-red-700 mb-6">Gagal memuat jadwal.</p>}
      {!error && jadwal.length === 0 && (
        <p className="text-core text-sm">Belum ada jadwal yang disetujui.</p>
      )}

      {jadwal.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
                <th className="text-left p-4">Jenis</th>
                <th className="text-left p-4">Kegiatan</th>
                <th className="text-left p-4">Tanggal</th>
                <th className="text-left p-4">Waktu</th>
                <th className="text-left p-4">Laboratorium</th>
              </tr>
            </thead>
            <tbody>
              {jadwal.map((j) => (
                <tr key={j.id} className="border-b border-line last:border-0">
                  <td className="p-4 text-core">
                    {j.jenis_kegiatan === "praktikum" ? "Praktikum" : "Non-Praktikum"}
                  </td>
                  <td className="p-4 text-ink font-medium">
                    {j.jenis_kegiatan === "praktikum" ? (
                      <>
                        {j.praktikum_nama}
                        <p className="text-xs text-core font-normal">{j.modul}</p>
                      </>
                    ) : (
                      <>
                        {nonPraktikumLabel(j.kegiatan_non_praktikum)}
                        {j.kegiatan_non_praktikum === "lainnya" && j.deskripsi_lainnya && (
                          <p className="text-xs text-core font-normal">{j.deskripsi_lainnya}</p>
                        )}
                      </>
                    )}
                  </td>
                  <td className="p-4 text-core font-mono whitespace-nowrap">{formatDate(j.tanggal)}</td>
                  <td className="p-4 text-core font-mono whitespace-nowrap">
                    {j.jam_mulai}–{j.jam_selesai}
                  </td>
                  <td className="p-4 text-core">{j.lokasi || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
