import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RecapDateRangeForm } from "@/components/dashboard/RecapDateRangeForm";
import { getSession } from "@/lib/auth/session";
import { supabasePublic } from "@/lib/supabase/authed";
import { redirect } from "next/navigation";

export const revalidate = 0;

// Halaman ini admin-only (lihat juga app/api/admin/practicum-requests/recap/route.ts,
// yang menolak non-admin dengan 403 terlepas dari halaman ini). middleware.ts
// sudah otomatis meloloskan admin untuk semua /admin/*, jadi di sini cukup
// jaga-jaga kedua: redirect kalau somehow bukan admin yang sampai ke sini.
export default async function RekapPage() {
  const session = await getSession();
  if (!session || session.appRole !== "admin") {
    redirect("/admin");
  }

  const supabase = supabasePublic();
  const { data: facilitiesData } = await supabase
    .from("facilities")
    .select("name")
    .eq("status", "published")
    .order("name");
  const labNames = (facilitiesData ?? []).map((f: { name: string }) => f.name);

  return (
    <DashboardShell title="Rekap Kegiatan">
      <p className="text-core text-sm mb-8 max-w-xl">
        Unduh rekap kegiatan lab dalam bentuk Excel untuk rentang tanggal dan filter tertentu —
        cocok untuk laporan bulanan/semester. Untuk rekap cepat berdasarkan filter yang sedang
        kamu lihat, pakai tombol "Download Excel" di halaman{" "}
        <a href="/admin/practicum-requests" className="text-petrol underline hover:text-rig">
          Kelola Pengajuan
        </a>
        .
      </p>
      <RecapDateRangeForm labs={labNames} />
    </DashboardShell>
  );
}
