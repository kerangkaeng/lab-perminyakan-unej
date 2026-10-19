import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabasePublic } from "@/lib/supabase/authed";
import { PracticumRequest } from "@/types";
import { formatDate } from "@/lib/utils";
import { nonPraktikumLabel, NON_PRAKTIKUM_OPTIONS } from "@/lib/constants/kegiatan";
import { todayWIB } from "@/lib/practicum/schedule";

// Jadwal disetujui bersifat publik (policy RLS requests_select_approved_public
// untuk role anon), jadi halaman ini sengaja TIDAK diproteksi middleware —
// siapapun boleh melihatnya, termasuk yang belum login.
export const revalidate = 0;

const PAGE_SIZE = 10;

const labelClass = "block text-xs font-mono uppercase text-core mb-1";
const fieldClass = "border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-petrol";

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

type Filters = {
  jenis: string;
  lab: string;
  q: string;
  periode: string; // all | upcoming | past
  dari: string;
  sampai: string;
  urutan: string; // asc | desc
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildHref(page: number, f: Filters) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (f.jenis !== "all") params.set("jenis", f.jenis);
  if (f.lab !== "all") params.set("lab", f.lab);
  if (f.q) params.set("q", f.q);
  if (f.periode !== "all") params.set("periode", f.periode);
  if (f.dari) params.set("dari", f.dari);
  if (f.sampai) params.set("sampai", f.sampai);
  if (f.urutan !== "asc") params.set("urutan", f.urutan);
  return `/practicum/jadwal?${params.toString()}`;
}

// Buang karakter yang punya arti khusus di sintaks filter .or() PostgREST
// (koma, kurung, wildcard, kutip, backslash) supaya input pencarian aman.
function sanitizeSearch(raw: string) {
  return raw.replace(/[,()%*_"\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export default async function JadwalPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ page?: string; jenis?: string; lab?: string; q?: string; periode?: string; dari?: string; sampai?: string; urutan?: string }> }) {
  const searchParams = await searchParamsPromise;
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const jenisFilter = searchParams.jenis ?? "all";
  const labFilter = searchParams.lab ?? "all";
  const q = sanitizeSearch(searchParams.q ?? "");
  const periode = searchParams.periode === "upcoming" || searchParams.periode === "past" ? searchParams.periode : "all";
  let dari = DATE_RE.test(searchParams.dari ?? "") ? (searchParams.dari as string) : "";
  let sampai = DATE_RE.test(searchParams.sampai ?? "") ? (searchParams.sampai as string) : "";
  // Kalau user terbalik mengisi rentang, tukar saja daripada hasilnya kosong.
  if (dari && sampai && dari > sampai) [dari, sampai] = [sampai, dari];
  const urutan = searchParams.urutan === "desc" ? "desc" : "asc";
  const filters: Filters = { jenis: jenisFilter, lab: labFilter, q, periode, dari, sampai, urutan };
  const hasActiveFilter =
    jenisFilter !== "all" || labFilter !== "all" || !!q || periode !== "all" || !!dari || !!sampai || urutan !== "asc";
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = supabasePublic();

  const { data: facilitiesData } = await supabase
    .from("facilities")
    .select("name")
    .eq("status", "published")
    .order("name");
  const facilityNames = (facilitiesData ?? []).map((f) => f.name as string);

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

  if (q) {
    // Cari di nama praktikum, modul, deskripsi "lainnya", dan jenis kegiatan
    // non-praktikum (label -> nilai enum).
    const like = `%${q}%`;
    const conds = [
      `praktikum_nama.ilike.${like}`,
      `modul.ilike.${like}`,
      `deskripsi_lainnya.ilike.${like}`,
      `lokasi.ilike.${like}`,
    ];
    const matchedKegiatan = NON_PRAKTIKUM_OPTIONS.filter((o) =>
      o.label.toLowerCase().includes(q.toLowerCase())
    ).map((o) => o.value);
    if (matchedKegiatan.length > 0) {
      conds.push(`kegiatan_non_praktikum.in.(${matchedKegiatan.join(",")})`);
    }
    query = query.or(conds.join(","));
  }

  const today = todayWIB();
  if (periode === "upcoming") query = query.gte("tanggal", today);
  if (periode === "past") query = query.lt("tanggal", today);
  if (dari) query = query.gte("tanggal", dari);
  if (sampai) query = query.lte("tanggal", sampai);

  const asc = urutan === "asc";
  const { data, error, count } = await query
    .order("tanggal", { ascending: asc })
    .order("jam_mulai", { ascending: asc })
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

      <form method="get" className="mb-8 border border-line bg-mist/40 p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className={labelClass}>Cari Kegiatan</label>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nama praktikum, modul, atau kegiatan…"
              className={`${fieldClass} w-full`}
            />
          </div>
          <div>
            <label className={labelClass}>Jenis</label>
            <select name="jenis" defaultValue={jenisFilter} className={fieldClass}>
              <option value="all">Semua Jenis</option>
              <option value="praktikum">Praktikum</option>
              <option value="non_praktikum">Non-Praktikum</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Laboratorium</label>
            <select name="lab" defaultValue={labFilter} className={fieldClass}>
              <option value="all">Semua Laboratorium</option>
              {facilityNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className={labelClass}>Periode</label>
            <select name="periode" defaultValue={periode} className={fieldClass}>
              <option value="all">Semua Jadwal</option>
              <option value="upcoming">Mendatang (mulai hari ini)</option>
              <option value="past">Sudah Lewat</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Dari Tanggal</label>
            <input type="date" name="dari" defaultValue={dari} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Sampai Tanggal</label>
            <input type="date" name="sampai" defaultValue={sampai} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Urutkan</label>
            <select name="urutan" defaultValue={urutan} className={fieldClass}>
              <option value="asc">Tanggal: Terlama / Terdekat Dulu</option>
              <option value="desc">Tanggal: Terbaru / Terjauh Dulu</option>
            </select>
          </div>
          <button
            type="submit"
            className="border border-petrol text-petrol px-4 py-2 text-sm hover:bg-petrol hover:text-paper transition-colors"
          >
            Terapkan Filter
          </button>
          {hasActiveFilter && (
            <Link href="/practicum/jadwal" className="text-sm text-core hover:text-rig underline py-2">
              Reset filter
            </Link>
          )}
        </div>
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
                  <th className="text-left p-4">
                    <Link
                      href={buildHref(1, { ...filters, urutan: asc ? "desc" : "asc" })}
                      className="inline-flex items-center gap-1 hover:text-petrol"
                      title="Klik untuk membalik urutan tanggal"
                    >
                      Tanggal <span aria-hidden>{asc ? "↑" : "↓"}</span>
                    </Link>
                  </th>
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
                    href={buildHref(currentPage - 1, filters)}
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
                      href={buildHref(p, filters)}
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
                    href={buildHref(currentPage + 1, filters)}
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
