import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/authed";
import { Button } from "@/components/ui/Button";

export const revalidate = 0;

export default async function ModuleDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabasePublic();
  const { data } = await supabase
    .from("practicum_modules")
    .select("title, description, file_url, facilities ( name )")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!data) return notFound();

  const facility = (data.facilities as unknown as { name: string } | null)?.name;

  return (
    <div className="container-lab py-16 max-w-2xl">
      <p className="eyebrow mb-3">Modul Praktikum{facility ? ` · ${facility}` : ""}</p>
      <h1 className="text-2xl md:text-3xl font-display font-semibold mb-6">{data.title}</h1>
      <p className="text-core mb-8 whitespace-pre-line">
        {data.description || "Deskripsi modul belum ditambahkan."}
      </p>
      {data.file_url ? (
        <Button href={data.file_url}>Download Modul</Button>
      ) : (
        <p className="text-sm text-core font-mono">Berkas modul belum diunggah oleh admin.</p>
      )}
    </div>
  );
}
