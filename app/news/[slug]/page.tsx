import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabasePublic();
  const { data } = await supabase.from("news").select("*").eq("slug", params.slug).single();

  if (!data) return notFound();
  const item = data as NewsRecord;

  return (
    <article className="container-lab section-space max-w-2xl">
      {item.cover_image && (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden bg-mist">
          <img src={item.cover_image} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}
      <p className="font-mono text-xs text-core mb-3">{formatDate(item.date)}</p>
      <h1 className="mb-8 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">{item.title}</h1>
      <p className="text-core leading-relaxed whitespace-pre-line">{item.content}</p>
    </article>
  );
}
