import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export async function LatestNews() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("date", { ascending: false })
    .limit(3);

  const news = (data as NewsRecord[]) ?? [];

  if (news.length === 0) return null;

  return (
    <section className="container-lab section-space border-t border-line">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6 sm:mb-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-4">Berita &amp; Kegiatan</p>
          <h2 className="text-3xl font-display font-semibold sm:text-4xl md:text-5xl">
            Kabar terbaru laboratorium
          </h2>
        </div>
        <Link href="/news" className="text-sm text-petrol transition-colors hover:text-rig">
          Semua berita →
        </Link>
      </div>

      <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => (
          <Link
            key={n.slug}
            href={`/news/${n.slug}`}
            className="group block transition-transform duration-500 hover:-translate-y-1"
          >
            <div className="relative mb-5 aspect-[16/10] overflow-hidden bg-mist">
              {n.cover_image ? (
                <img src={n.cover_image} alt={n.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="h-full w-full bg-mist" />
              )}
            </div>
            <p className="font-mono text-xs text-core mb-3">{formatDate(n.date)}</p>
            <h3 className="font-display text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-rig">
              {n.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-core">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
