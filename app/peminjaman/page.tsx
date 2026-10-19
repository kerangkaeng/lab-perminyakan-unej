import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoanForm, type LoanEquipmentOption } from "@/components/loans/LoanForm";
import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_BIDANG_ALAT_UMUM, LAB_TITLE, formatTanggalId, sortBidang, type LoanRecord } from "@/lib/loans/config";
import { BIDANG_VALUES, type Bidang } from "@/lib/lab-roles";

export const revalidate = 0;

export default async function PeminjamanPage() {
  // Middleware sudah mengarahkan ke /login; ini lapis kedua kalau sesi sudah tidak valid.
  const session = await getSession();
  if (!session) redirect("/login?redirect=/peminjaman");

  const db = supabaseServer();

  const [{ data: eqRows }, { data: me, error: meErr }, { data: loanRows }] = await Promise.all([
    db
      .from("equipment")
      .select("id, name, jenis, facility_id, facilities(bidang)")
      .eq("status", "published")
      .in("jenis", ["alat", "bahan"])
      .order("name", { ascending: true }),
    db.from("users").select("ttd").eq("id", session.usersId).single(),
    db
      .from("equipment_loans")
      .select("*")
      .eq("requester_id", session.usersId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  type EqRow = {
    id: string;
    name: string;
    jenis: "alat" | "bahan";
    facility_id: string | null;
    facilities: { bidang: Bidang | null } | { bidang: Bidang | null }[] | null;
  };

  const options: LoanEquipmentOption[] = ((eqRows ?? []) as unknown as EqRow[]).map((r) => {
    const fac = Array.isArray(r.facilities) ? r.facilities[0] : r.facilities;
    const known = fac?.bidang && (BIDANG_VALUES as readonly string[]).includes(fac.bidang);
    return {
      id: r.id,
      name: r.name,
      jenis: r.jenis,
      bidang: known ? (fac!.bidang as Bidang) : DEFAULT_BIDANG_ALAT_UMUM,
      umum: !r.facility_id || !known,
    };
  });

  const loans = (loanRows ?? []) as LoanRecord[];
  const migrationMissing = !!meErr;

  return (
    <DashboardShell title="Peminjaman Alat & Bahan">
      <p className="mb-8 max-w-2xl text-core">
        Pilih alat atau bahan laboratorium yang ingin dipinjam, lalu buat dokumen peminjaman (PDF) yang
        sudah memuat kop laboratorium dan tanda tangan. Halaman ini khusus peminjaman alat/bahan —
        untuk memakai ruang laboratorium, gunakan{" "}
        <Link href="/practicum/ajukan" className="text-petrol underline">
          Pengajuan Kegiatan
        </Link>
        .
      </p>

      {migrationMissing ? (
        <p className="max-w-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Fitur peminjaman belum aktif di database (migrasi 010 belum dijalankan).
        </p>
      ) : (
        <LoanForm options={options} />
      )}

      <section className="mt-14 max-w-3xl">
        <h2 className="mb-3 font-display text-lg font-semibold">Riwayat peminjaman</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-core">Belum ada dokumen peminjaman.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {loans.map((loan) => (
              <li key={loan.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {loan.items.length} item · {sortBidang(loan.bidang).map((b) => LAB_TITLE[b]).join(" + ")}
                  </p>
                  <p className="text-xs text-core">
                    Pinjam {formatTanggalId(loan.tanggal_pinjam)} – kembali {formatTanggalId(loan.tanggal_kembali)}
                  </p>
                  <p className="mt-0.5 max-w-md truncate text-xs text-core" title={loan.keperluan}>
                    {loan.keperluan}
                  </p>
                </div>
                <a
                  href={`/api/loans/${loan.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 border border-petrol px-3 py-1.5 text-xs text-petrol transition-colors hover:bg-petrol hover:text-paper"
                >
                  Unduh PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
