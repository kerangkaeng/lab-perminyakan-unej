import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewsForm } from "@/components/admin/NewsForm";
import { requireAdminSession } from "@/lib/auth/guards";

export default async function NewNewsPage() {
  await requireAdminSession("/admin/news/new");
  return (
    <DashboardShell title="Tulis Berita Baru">
      <NewsForm mode="create" />
    </DashboardShell>
  );
}
