import Link from "next/link";
import { news } from "@/data/news";
import { formatDate } from "@/lib/utils";

export function LatestNews() {
  return (
    <section className="container-lab py-14 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow mb-3">Berita &amp; Kegiatan</p>
          <h2 className="text-2xl md:text-3xl font-display font-semibold">Kabar terbaru laboratorium</h2>
        </div>
        <Link href="/news" className="text-sm text-petrol hover:text-rig transition-colors">
          Semua berita →
        </Link>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((n) => (
          <Link
            key={n.slug}
            href={`/news/${n.slug}`}
            className="group block p-1 -m-1 transition-transform duration-300 hover:-translate-y-1"
          >
            <p className="font-mono text-xs text-core mb-2">{formatDate(n.date)}</p>
            <h3 className="font-display text-lg font-semibold text-ink group-hover:text-rig transition-colors">
              {n.title}
            </h3>
            <p className="mt-2 text-sm text-core leading-relaxed">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
