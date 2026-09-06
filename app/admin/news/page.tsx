import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewsListActions } from "@/components/admin/NewsListActions";
import { getSessionToken } from "@/lib/auth/session";
import { supabaseAuthed } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export const revalidate = 0;

export default async function AdminNewsPage() {
  const token = getSessionToken();
  let items: NewsRecord[] = [];
  let loadError: string | null = null;

  if (token) {
    const supabase = supabaseAuthed(token);
    const { data, error } = await supabase.from("news").select("*").order("date", { ascending: false });
    if (error) {
      loadError = "Gagal memuat data berita.";
    } else {
      items = (data as NewsRecord[]) ?? [];
    }
  }

  return (
    <DashboardShell title="Kelola Berita">
      <div className="mb-8">
        <Button href="/admin/news/new">Tulis Berita Baru</Button>
      </div>

      {loadError && <p className="text-sm text-red-700 mb-6">{loadError}</p>}
      {!loadError && items.length === 0 && <p className="text-core text-sm">Belum ada berita.</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist border-b border-line font-mono text-xs uppercase tracking-wide text-core">
                <th className="text-left p-4">Tanggal</th>
                <th className="text-left p-4">Judul</th>
                <th className="text-left p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} className="border-b border-line last:border-0">
                  <td className="p-4 text-core font-mono whitespace-nowrap">{formatDate(n.date)}</td>
                  <td className="p-4 text-ink font-medium">
                    {n.title}
                    <p className="text-xs text-core font-normal font-mono">/{n.slug}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 items-center">
                      <Link href={`/admin/news/${n.id}/edit`} className="text-xs text-petrol underline hover:text-rig">
                        Edit
                      </Link>
                      <NewsListActions id={n.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
