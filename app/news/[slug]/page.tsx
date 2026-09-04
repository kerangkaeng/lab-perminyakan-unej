import { notFound } from "next/navigation";
import { news } from "@/data/news";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
}

export default function NewsDetailPage({ params }: { params: { slug: string } }) {
  const item = news.find((n) => n.slug === params.slug);
  if (!item) return notFound();

  return (
    <article className="container-lab py-16 max-w-2xl">
      <p className="font-mono text-xs text-core mb-3">{formatDate(item.date)}</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-8">{item.title}</h1>
      <p className="text-core leading-relaxed">{item.content}</p>
    </article>
  );
}
