import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/authed";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { EquipmentList } from "@/components/facilities/EquipmentList";

export const revalidate = 0;

interface EquipmentRow {
  id: string;
  name: string;
  spec: string | null;
  function: string | null;
  image: string | null;
  sop_pdf_url: string | null;
}

export default async function FacilityDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabasePublic();
  const { data: facilityRow } = await supabase
    .from("facilities")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!facilityRow) return notFound();

  const { data: equipmentData } = await supabase
    .from("equipment")
    .select("*")
    .eq("facility_id", facilityRow.id)
    .eq("status", "published")
    .order("name");

  const equipment = (equipmentData ?? []) as EquipmentRow[];

  return (
    <div className="container-lab section-space">
      <div className="relative mb-12 aspect-[21/9] overflow-hidden bg-mist sm:mb-16">
        <CoverImage src={facilityRow.cover_image} seed={facilityRow.slug} alt={facilityRow.name} className="object-cover" />
      </div>

      <p className="eyebrow mb-4">{facilityRow.name_en}</p>
      <h1 className="mb-8 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">{facilityRow.name}</h1>
      <p className="mb-16 max-w-2xl text-lg leading-relaxed text-core">{facilityRow.description}</p>

      <h2 className="mb-6 font-display text-2xl font-semibold">Peralatan</h2>
      {equipment.length === 0 ? (
        <p className="text-core text-sm">Belum ada data peralatan.</p>
      ) : (
        <EquipmentList equipment={equipment} />
      )}

      {facilityRow.modules && facilityRow.modules.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold">Modul Praktikum Terkait</h2>
          <ul className="flex flex-wrap gap-3">
            {facilityRow.modules.map((m: string) => (
              <li key={m} className="border border-line px-4 py-2 text-sm text-core">{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-16">
        <Button href="/practicum">Lihat Jadwal Praktikum</Button>
      </div>
    </div>
  );
}
