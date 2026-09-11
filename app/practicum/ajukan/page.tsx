import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AjukanForm } from "@/components/dashboard/AjukanForm";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

export default async function AjukanPraktikumPage() {
  const supabase = supabasePublic();

  const [{ data: facilitiesData }, { data: modulesData }] = await Promise.all([
    supabase.from("facilities").select("name").eq("status", "published").order("name"),
    supabase.from("practicum_modules").select("title").eq("status", "published").order("title"),
  ]);

  const facilityNames = (facilitiesData ?? []).map((f) => f.name as string);
  const practicumNames = (modulesData ?? []).map((m) => m.title as string);

  return (
    <DashboardShell title="Ajukan Kegiatan">
      <p className="text-core mb-8 max-w-xl">
        Isi form berikut untuk mengajukan jadwal kegiatan praktikum. Pengajuan
        akan ditinjau oleh admin laboratorium sebelum tampil di menu Jadwal.
      </p>
      <AjukanForm facilityNames={facilityNames} practicumNames={practicumNames} />
    </DashboardShell>
  );
}
