import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AjukanForm } from "@/components/dashboard/AjukanForm";

export default function AjukanPraktikumPage() {
  return (
    <DashboardShell title="Ajukan Praktikum">
      <p className="text-core mb-8 max-w-xl">
        Isi form berikut untuk mengajukan jadwal kegiatan praktikum. Pengajuan
        akan ditinjau oleh admin laboratorium sebelum tampil di menu Jadwal.
      </p>
      <AjukanForm />
    </DashboardShell>
  );
}
