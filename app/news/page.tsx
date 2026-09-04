import Link from "next/link";
import { news } from "@/data/news";
import { formatDate } from "@/lib/utils";

export default function NewsPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">News</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">Berita & Pengumuman</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {news.map((n) => (
          <Link key={n.slug} href={`/news/${n.slug}`} className="border border-line p-6 hover:border-petrol transition-colors">
            <p className="font-mono text-xs text-core mb-2">{formatDate(n.date)}</p>
            <h2 className="font-display text-lg font-semibold text-ink mb-2">{n.title}</h2>
            <p className="text-sm text-core">{n.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
