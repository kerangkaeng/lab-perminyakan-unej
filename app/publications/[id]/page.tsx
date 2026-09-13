import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
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
  return <p className="text-base italic text-core">{parts.join(", ")}</p>;
}

export default async function PublicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("publications")
    .select("*")
    .eq("id", params.id)
    .eq("status", "published")
    .single();

  if (!data) return notFound();
  const pub = data as PublicationRow;

  return (
    <div className="container-lab section-space max-w-3xl">
      <Link href="/publications" className="text-sm text-petrol hover:text-rig underline mb-8 inline-block">
        ← Kembali ke Publikasi
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="font-mono text-xs uppercase tracking-wide text-rig border border-rig px-2 py-1">
          {typeLabels[pub.type] ?? pub.type}
        </span>
        <span className="font-mono text-xs text-core">{pub.year}</span>
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink mb-3 leading-snug">
        {pub.title}
        {pub.doi && (
          <Link
            href={`https://doi.org/${pub.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex align-middle ml-3 text-rig hover:text-petrol transition-colors"
            title={`Buka DOI: ${pub.doi}`}
          >
            <ExternalLink size={20} />
          </Link>
        )}
      </h1>

      <p className="text-base text-petrol mb-1">{pub.authors}</p>
      <CitationLine pub={pub} />
      {(pub.publisher || pub.issn) && (
        <p className="text-sm text-core mt-1">
          {pub.publisher}
          {pub.publisher && pub.issn ? " — " : ""}
          {pub.issn ? `ISSN ${pub.issn}` : ""}
        </p>
      )}

      {pub.doi && (
        <p className="mt-3 font-mono text-sm text-core">
          DOI:{" "}
          <Link href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="text-petrol hover:text-rig underline">
            {pub.doi}
          </Link>
        </p>
      )}

      {pub.abstract && (
        <div className="mt-8 pt-8 border-t border-line">
          <h2 className="font-display text-lg font-semibold mb-3">Abstract</h2>
          <p className="text-base leading-relaxed text-core">{pub.abstract}</p>
        </div>
      )}

      {pub.keywords && pub.keywords.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-mono uppercase text-core mb-2">Keywords</p>
          <div className="flex flex-wrap gap-2">
            {pub.keywords.map((kw) => (
              <Link
                key={kw}
                href={`/publications?keyword=${encodeURIComponent(kw)}`}
                className="font-mono text-[11px] uppercase bg-mist text-core hover:bg-petrol hover:text-white px-2.5 py-1 transition-colors"
              >
                {kw}
              </Link>
            ))}
          </div>
        </div>
      )}

      {pub.url && (
        <div className="mt-8 pt-6 border-t border-line">
          <Link
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-petrol hover:text-rig underline"
          >
            Link Tambahan →
          </Link>
        </div>
      )}
    </div>
  );
}
