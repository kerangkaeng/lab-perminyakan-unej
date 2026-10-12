import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AjukanForm } from "@/components/dashboard/AjukanForm";
import { getSession, getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed, supabasePublic } from "@/lib/supabase/authed";
import { getSubmissionBlock } from "@/lib/practicum/submissionBlock";

export const revalidate = 0;

export default async function AjukanPraktikumPage() {
  const supabase = supabasePublic();
  const session = await getSession();
  const token = await getSessionToken();

  const [{ data: facilitiesData }, { data: modulesData }, block] = await Promise.all([
    supabase.from("facilities").select("name").eq("status", "published").order("name"),
    supabase.from("practicum_modules").select("title").eq("status", "published").order("title"),
    // Peringatan di depan: kalau masih ada revisi/administrasi yang belum beres,
    // form tidak ditampilkan (server tetap menolak di POST /api/practicum/requests).
    session && token ? getSubmissionBlock(supabaseAuthed(token), session.usersId) : Promise.resolve(null),
  ]);

  const facilityNames = (facilitiesData ?? []).map((f) => f.name as string);
  const practicumNames = (modulesData ?? []).map((m) => m.title as string);

  return (
    <DashboardShell title="Ajukan Kegiatan">
      {block ? (
        <div className="max-w-xl space-y-4">
          <p className="text-sm text-red-700 border border-red-300 bg-red-50 px-4 py-3">{block.message}</p>
          <Link
            href="/practicum/status"
            className="inline-block text-sm border border-petrol text-petrol px-4 py-2 hover:bg-petrol hover:text-paper transition-colors"
          >
            Buka Status Pengajuan
          </Link>
        </div>
      ) : (
        <>
          <p className="text-core mb-8 max-w-xl">
            Isi form berikut untuk mengajukan jadwal kegiatan praktikum. Pengajuan
            akan ditinjau oleh admin laboratorium sebelum tampil di menu Jadwal.
          </p>
          <AjukanForm facilityNames={facilityNames} practicumNames={practicumNames} />
        </>
      )}
    </DashboardShell>
  );
}
