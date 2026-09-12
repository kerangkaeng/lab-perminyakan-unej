import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

interface PublicationRow {
  id: string;
  year: number;
  title: string;
  authors: string;
  type: "Journal" | "Conference" | "Thesis";
  url: string | null;
  journal_name: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  publisher: string | null;
  issn: string | null;
  doi: string | null;
  abstract: string | null;
  keywords: string[] | null;
}

const typeLabels: Record<string, string> = {
  Journal: "Jurnal",
  Conference: "Prosiding Konferensi",
  Thesis: "Tugas Akhir",
};

function CitationLine({ pub }: { pub: PublicationRow }) {
  const parts: string[] = [];
  if (pub.journal_name) parts.push(pub.journal_name);
  if (pub.volume) parts.push(`Vol. ${pub.volume}${pub.issue ? `(${pub.issue})` : ""}`);
  if (pub.pages) parts.push(`hlm. ${pub.pages}`);
  if (parts.length === 0) return null;
  return <p className="text-sm italic text-core">{parts.join(", ")}</p>;
}

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: { keyword?: string };
}) {
  const activeKeyword = searchParams?.keyword;
  const supabase = supabasePublic();

  // Ambil semua publikasi published dulu (untuk hitung daftar keyword unik + filter di memory)
  const { data } = await supabase
    .from("publications")
    .select("*")
    .eq("status", "published")
    .order("year", { ascending: false });

  const allPublications = (data ?? []) as PublicationRow[];

  // Kumpulkan semua keyword unik dari seluruh publikasi
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
        <div className="flex flex-wrap gap-2 mb-12 pb-8 border-b border-line">
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
        <div className="space-y-8">
          {publications.map((pub) => (
            <article key={pub.id} className="border border-line p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <span className="font-mono text-xs uppercase tracking-wide text-rig border border-rig px-2 py-1">
                  {typeLabels[pub.type] ?? pub.type}
                </span>
                <span className="font-mono text-xs text-core">{pub.year}</span>
              </div>

              <h2 className="font-display text-xl md:text-2xl font-semibold text-ink mb-2 leading-snug">
                {pub.title}
              </h2>
              <p className="text-sm text-petrol mb-1">{pub.authors}</p>
              <CitationLine pub={pub} />
              {(pub.publisher || pub.issn) && (
                <p className="text-xs text-core mt-1">
                  {pub.publisher}
                  {pub.publisher && pub.issn ? " — " : ""}
                  {pub.issn ? `ISSN ${pub.issn}` : ""}
                </p>
              )}

              {pub.abstract && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-sm font-medium text-petrol hover:text-rig transition-colors list-none flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">▸</span> Abstract
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-core border-l-2 border-mist pl-4">
                    {pub.abstract}
                  </p>
                </details>
              )}

              {pub.keywords && pub.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {pub.keywords.map((kw) => (
                    <Link
                      key={kw}
                      href={`/publications?keyword=${encodeURIComponent(kw)}`}
                      className={`font-mono text-[11px] uppercase px-2.5 py-1 transition-colors ${
                        activeKeyword === kw
                          ? "bg-rig text-white"
                          : "bg-mist text-core hover:bg-petrol hover:text-white"
                      }`}
                    >
                      {kw}
                    </Link>
                  ))}
                </div>
              )}

              {(pub.doi || pub.url) && (
                <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-line">
                  {pub.doi && (
                    <Link
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-paper bg-petrol hover:bg-petrol-light px-4 py-2 transition-colors"
                    >
                      DOI: {pub.doi} →
                    </Link>
                  )}
                  {pub.url && (
                    <Link
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-petrol hover:text-rig underline self-center"
                    >
                      Link Tambahan →
                    </Link>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
