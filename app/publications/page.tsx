import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

interface PublicationRow {
  id: string;
  year: number;
  title: string;
  authors: string;
  type: "Journal" | "Conference" | "Thesis";
  journal_name: string | null;
  keywords: string[] | null;
}

const typeLabels: Record<string, string> = {
  Journal: "Jurnal",
  Conference: "Prosiding Konferensi",
  Thesis: "Tugas Akhir",
};

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: { keyword?: string };
}) {
  const activeKeyword = searchParams?.keyword;
  const supabase = supabasePublic();

  const { data } = await supabase
    .from("publications")
    .select("*")
    .eq("status", "published")
    .order("year", { ascending: false });

  const allPublications = (data ?? []) as PublicationRow[];

  const keywordCounts = new Map<string, number>();
  for (const pub of allPublications) {
    for (const kw of pub.keywords ?? []) {
      keywordCounts.set(kw, (keywordCounts.get(kw) ?? 0) + 1);
    }
  }
  const allKeywords = Array.from(keywordCounts.keys()).sort();

  const publications = activeKeyword
    ? allPublications.filter((pub) => (pub.keywords ?? []).includes(activeKeyword))
    : allPublications;

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Publications</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">Publikasi</h1>
      <p className="text-core max-w-2xl mb-8">
        Kumpulan publikasi ilmiah hasil penelitian dosen dan mahasiswa Laboratorium Teknik Perminyakan.
      </p>

      {allKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10 pb-8 border-b border-line">
          <Link
            href="/publications"
            className={`font-mono text-[11px] uppercase px-3 py-1.5 border transition-colors ${
              !activeKeyword ? "border-rig bg-rig/10 text-rig" : "border-line text-core hover:border-petrol"
            }`}
          >
            Semua
          </Link>
          {allKeywords.map((kw) => (
            <Link
              key={kw}
              href={`/publications?keyword=${encodeURIComponent(kw)}`}
              className={`font-mono text-[11px] uppercase px-3 py-1.5 border transition-colors ${
                activeKeyword === kw ? "border-rig bg-rig/10 text-rig" : "border-line text-core hover:border-petrol"
              }`}
            >
              {kw} <span className="opacity-60">({keywordCounts.get(kw)})</span>
            </Link>
          ))}
        </div>
      )}

      {publications.length === 0 ? (
        <p className="text-core text-sm">
          {activeKeyword ? `Tidak ada publikasi dengan keyword "${activeKeyword}".` : "Belum ada publikasi."}
        </p>
      ) : (
        <div className="divide-y divide-line border-t border-b border-line">
          {publications.map((pub) => (
            <Link
              key={pub.id}
              href={`/publications/${pub.id}`}
              className="block py-5 group hover:bg-mist/50 transition-colors -mx-4 px-4"
            >
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono text-[11px] uppercase tracking-wide text-rig border border-rig px-2 py-0.5">
                  {typeLabels[pub.type] ?? pub.type}
                </span>
                <span className="font-mono text-xs text-core">{pub.year}</span>
              </div>
              <h2 className="font-display text-lg font-semibold text-ink group-hover:text-rig transition-colors mb-1">
                {pub.title}
              </h2>
              <p className="text-sm text-petrol">
                {pub.authors}
                {pub.journal_name && <span className="text-core italic"> — {pub.journal_name}</span>}
              </p>
              {pub.keywords && pub.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pub.keywords.slice(0, 4).map((kw) => (
                    <span key={kw} className="font-mono text-[10px] uppercase text-core bg-mist px-2 py-0.5">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
