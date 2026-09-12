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

export default async function PublicationsPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("publications")
    .select("*")
    .eq("status", "published")
    .order("year", { ascending: false });

  const publications = (data ?? []) as PublicationRow[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Publications</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">Publikasi</h1>
      <p className="text-core max-w-2xl mb-12">
        Kumpulan publikasi ilmiah hasil penelitian dosen dan mahasiswa Laboratorium Teknik Perminyakan.
      </p>

      {publications.length === 0 ? (
        <p className="text-core text-sm">Belum ada publikasi.</p>
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
                    <span key={kw} className="font-mono text-[11px] uppercase bg-mist text-core px-2.5 py-1">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {(pub.doi || pub.url) && (
                <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-line">
                  {pub.doi && (
                    
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-paper bg-petrol hover:bg-petrol-light px-4 py-2 transition-colors"
                    >
                      DOI: {pub.doi} →
                    </a>
                  )}
                  {pub.url && (
                    
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-petrol hover:text-rig underline self-center"
                    >
                      Link Tambahan →
                    </a>
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
