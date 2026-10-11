import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewsForm } from "@/components/admin/NewsForm";
import { getSessionToken } from "@/lib/auth/session";
import { requireAdminSession } from "@/lib/auth/guards";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";

export default async function EditNewsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  await requireAdminSession(`/admin/news/${params.id}/edit`);
  const token = await getSessionToken();
  if (!token) return notFound();

  const supabase = supabaseAuthed(token);
  const { data, error } = await supabase.from("news").select("*").eq("id", params.id).single();

  if (error || !data) return notFound();

  return (
    <DashboardShell title="Edit Berita">
      <NewsForm mode="edit" initial={data as NewsRecord} />
    </DashboardShell>
  );
}
