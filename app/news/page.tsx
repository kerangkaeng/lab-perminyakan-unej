import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function NewsPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("date", { ascending: false });

  const news = (data as NewsRecord[]) ?? [];

  return (
    <div className="container-lab section-space">
      <p className="eyebrow mb-4">News</p>
      <h1 className="mb-16 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">
        Berita &amp; Pengumuman
      </h1>

      {news.length === 0 && <p className="text-core text-sm">Belum ada berita.</p>}

      <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => (
          <Link key={n.slug} href={`/news/${n.slug}`} className="group block">
            <div className="relative mb-5 aspect-[16/10] overflow-hidden bg-mist">
              {n.cover_image && (
                <img src={n.cover_image} alt={n.title} className="h-full w-full object-cover" />
              )}
            </div>
            <p className="font-mono text-xs text-core mb-3">{formatDate(n.date)}</p>
            <h3 className="font-display text-xl font-semibold text-ink group-hover:text-rig transition-colors">
              {n.title}
            </h3>
            <p className="mt-3 text-sm text-core">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
