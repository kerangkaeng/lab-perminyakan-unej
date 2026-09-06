import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/authed";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";
import { AlurPengajuanDiagram } from "@/components/AlurPengajuanDiagram";

export const revalidate = 0;

const DIAGRAM_SLUG = "panduan-pengajuan-kegiatan-praktikum-dan-non-praktikum";

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabasePublic();
  const { data } = await supabase.from("news").select("*").eq("slug", params.slug).single();
  if (!data) return notFound();
  const item = data as NewsRecord;

  const showDiagram = params.slug === DIAGRAM_SLUG;

  return (
    <article className="container-lab section-space">
      {item.cover_image && (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden bg-mist">
          <img src={item.cover_image} alt={item.title} className="h-full w-full object-contain" />
        </div>
      )}
      <div className="max-w-2xl">
        <p className="font-mono text-xs text-core mb-3">{formatDate(item.date)}</p>
        <h1 className="mb-8 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">{item.title}</h1>

        <div className="prose-news" dangerouslySetInnerHTML={{ __html: item.content }} />

        {showDiagram && (
          <div className="my-10">
            <AlurPengajuanDiagram />
          </div>
        )}
      </div>
    </article>
  );
}
