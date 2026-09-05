import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabasePublic } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { nonPraktikumLabel } from "@/lib/constants/kegiatan";
import { facilities } from "@/data/facilities";

// Jadwal disetujui bersifat publik (policy RLS requests_select_approved_public
// untuk role anon), jadi halaman ini sengaja TIDAK diproteksi middleware —
// siapapun boleh melihatnya, termasuk yang belum login.
export const revalidate = 0;

const PAGE_SIZE = 10;

// Susun daftar nomor halaman dengan elipsis, mis. 1 2 3 ... 8 9 10
// supaya tidak menampilkan puluhan tombol nomor kalau data banyak.
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const windowSize = 1;

  for (let p = 1; p <= total; p++) {
    const isEdge = p === 1 || p === total;
    const isNearCurrent = Math.abs(p - current) <= windowSize;
    if (isEdge || isNearCurrent) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }
  return pages;
}

function buildHref(page: number, jenis: string, lab: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (jenis !== "all") params.set("jenis", jenis);
  if (lab !== "all") params.set("lab", lab);
  return `/practicum/jadwal?${params.toString()}`;
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams: { page?: string; jenis?: string; lab?: string };
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const jenisFilter = searchParams.jenis ?? "all";
  const labFilter = searchParams.lab ?? "all";
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = supabasePublic();
  let query = supabase
    .from("practicum_requests")
    .select(
      "id, jenis_kegiatan, praktikum_nama, modul, kegiatan_non_praktikum, deskripsi_lainnya, tanggal, jam_mulai, jam_selesai, lokasi, status",
      { count: "exact" }
    )
    .eq("status", "approved");

  if (jenisFilter === "praktikum" || jenisFilter === "non_praktikum") {
    query = query.eq("jenis_kegiatan", jenisFilter);
  }
  if (labFilter !== "all") {
    query = query.eq("lokasi", labFilter);
  }

  const { data, error, count } = await query
    .order("tanggal", { ascending: true })
    .range(from, to);

  const jadwal = (data as PracticumRequest[]) ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <DashboardShell title="Jadwal Kegiatan">
      <p className="text-core mb-8 max-w-xl">
        Jadwal kegiatan praktikum dan non-praktikum yang sudah disetujui admin laboratorium.
      </p>

      <form method="get" className="flex flex-wrap gap-4 mb-8 items-end">
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Jenis</label>
          <select
            name="jenis"
            defaultValue={jenisFilter}
            className="border border-line bg-mist px-3 py-2 text-sm"
          >
            <option value="all">Semua Jenis</option>
            <option value="praktikum">Praktikum</option>
            <option value="non_praktikum">Non-Praktikum</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-core mb-1">Laboratorium</label>
          <select
            name="lab"
            defaultValue={labFilter}
            className="border border-line bg-mist px-3 py-2 text-sm"
          >
            <option value="all">Semua Laboratorium</option>
            {facilities.map((f) => (
              <option key={f.slug} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="border border-petrol text-petrol px-4 py-2 text-sm hover:bg-petrol hover:text-paper transition-colors"
        >
          Terapkan Filter
        </button>
        {(jenisFilter !== "all" || labFilter !== "all") && (
          <Link href="/practicum/jadwal" className="text-sm text-core hover:text-rig underline">
            Reset filter
          </Link>
        )}
      </form>

      {error && <p className="text-sm text-red-700 mb-6">Gagal memuat jadwal.</p>}
      {!error && jadwal.length === 0 && (
        <p className="text-core text-sm">Belum ada jadwal yang cocok dengan filter ini.</p>
      )}

      {jadwal.length > 0 && (
        <>
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

          {totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-between gap-4 mt-6 text-sm">
              <p className="text-core">
                Halaman {currentPage} dari {totalPages} &middot; {totalCount} kegiatan
              </p>
              <div className="flex gap-2 flex-wrap">
                {currentPage > 1 && (
                  <Link
                    href={buildHref(currentPage - 1, jenisFilter, labFilter)}
                    className="border border-line px-3 py-1.5 hover:border-petrol transition-colors"
                  >
                    &larr; Sebelumnya
                  </Link>
                )}
                {pageNumbers.map((p, i) =>
                  p === "ellipsis" ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-core">
                      &hellip;
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={buildHref(p, jenisFilter, labFilter)}
                      className={`border px-3 py-1.5 transition-colors ${
                        p === currentPage
                          ? "border-petrol bg-petrol text-paper"
                          : "border-line hover:border-petrol"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                )}
                {currentPage < totalPages && (
                  <Link
                    href={buildHref(currentPage + 1, jenisFilter, labFilter)}
                    className="border border-line px-3 py-1.5 hover:border-petrol transition-colors"
                  >
                    Selanjutnya &rarr;
                  </Link>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </DashboardShell>
  );
}
