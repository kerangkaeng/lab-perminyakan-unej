import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { NewsRecord } from "@/types";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;

// Pratinjau berita (termasuk draf) — hanya untuk admin.
export default async function NewsPreviewPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  await requireAdminSession(`/news/${params.slug}/preview`);

  const { data } = await supabaseServer().from("news").select("*").eq("slug", params.slug).maybeSingle();
  if (!data) return notFound();
  const item = data as NewsRecord;

  return (
    <>
      <div className="bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-900">
        Pratinjau{item.status !== "published" ? " draf" : ""} — halaman ini hanya terlihat oleh admin.
      </div>
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
        </div>
      </article>
    </>
  );
}
