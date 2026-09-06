import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewsForm } from "@/components/admin/NewsForm";

export default function NewNewsPage() {
  return (
    <DashboardShell title="Tulis Berita Baru">
      <NewsForm mode="create" />
    </DashboardShell>
  );
}
