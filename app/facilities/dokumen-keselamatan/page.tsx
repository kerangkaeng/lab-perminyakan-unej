import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/authed";

export const revalidate = 0;

const categoryLabels: Record<string, string> = {
  tata_tertib_lab: "Tata Tertib Laboratorium",
  tata_tertib_praktikum: "Tata Tertib Praktikum",
  sop_limbah_b3: "SOP Pengelolaan Limbah B3",
  k3: "Keselamatan dan Kesehatan Kerja (K3)",
  poster_larangan: "Poster Larangan Laboratorium & Bahaya Fluida",
  poster_bencana_alam: "Poster Darurat Bencana Alam (Gempa Bumi)",
  poster_kebakaran: "Poster Darurat Kebakaran",
  pedoman_k3: "Pedoman K3 Laboratorium",
};

interface DocRow {
  id: string;
  category: string;
  title: string;
  file_type: "pdf" | "image";
  file_url: string;
}

export default async function DokumenKeselamatanPage() {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("lab_documents")
    .select("*")
    .eq("status", "published")
    .order("category");

  const docs = (data ?? []) as DocRow[];

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Fasilitas Laboratorium</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-10">
        Dokumen &amp; Keselamatan Kerja
      </h1>
      {docs.length === 0 ? (
        <p className="text-core text-sm">Belum ada dokumen.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-line p-5 hover:border-rig transition-colors group"
            >
              {doc.file_type === "image" ? (
                <div className="relative mb-4 aspect-[4/3] overflow-hidden bg-mist">
                  <img src={doc.file_url} alt={doc.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <p className="font-mono text-xs text-rig mb-3">PDF</p>
              )}
              <p className="font-mono text-xs uppercase text-core mb-1">{categoryLabels[doc.category]}</p>
              <p className="font-display font-semibold text-ink group-hover:text-rig transition-colors">{doc.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
