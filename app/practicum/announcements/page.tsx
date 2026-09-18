import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 0;

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  is_pinned: boolean;
  status: string;
  attachment_url: string | null;
}

export default async function AnnouncementsPage() {
  const supabase = supabaseServer();

  // Hanya tampilkan yang status = "published" ke publik. Yang di-pin
  // muncul lebih dulu, lalu diurutkan dari tanggal terbaru.
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("date", { ascending: false });

  const announcements: Announcement[] = data ?? [];

  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Praktikum</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Pengumuman</h1>
      {announcements.length === 0 ? (
        <p className="text-core text-sm">Belum ada pengumuman.</p>
      ) : (
        <ul className="space-y-6">
          {announcements.map((a) => (
            <li key={a.id} className="border-b border-line pb-6">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-xs text-core">
                  {new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {a.is_pinned && (
                  <span className="text-[10px] uppercase tracking-wide bg-rig/10 text-rig px-2 py-0.5 font-medium">
                    Disematkan
                  </span>
                )}
              </div>
              <p className="text-ink font-medium text-lg mb-1">{a.title}</p>
              <p className="text-sm text-core whitespace-pre-line">{a.content}</p>
              {a.attachment_url && (
                <a
                  href={a.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-medium text-petrol hover:text-rig underline"
                >
                  Lihat/Unduh Lampiran
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
