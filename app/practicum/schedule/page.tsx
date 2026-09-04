import { redirect } from "next/navigation";

// Halaman ini digabung ke /practicum/jadwal (jadwal dinamis dari pengajuan
// yang sudah disetujui admin). Redirect dipertahankan untuk link/bookmark lama.
export default function ScheduleRedirectPage() {
  redirect("/practicum/jadwal");
}
