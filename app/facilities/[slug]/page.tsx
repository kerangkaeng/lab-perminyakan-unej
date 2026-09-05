import { notFound } from "next/navigation";
import { facilities, getFacilityBySlug } from "@/data/facilities";
import { EquipmentTable } from "@/components/facilities/EquipmentTable";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return facilities.map((f) => ({ slug: f.slug }));
}

export default function FacilityDetailPage({ params }: { params: { slug: string } }) {
  const facility = getFacilityBySlug(params.slug);
  if (!facility) return notFound();

  return (
    <div className="container-lab section-space">
      <div className="relative mb-12 aspect-[21/9] overflow-hidden bg-mist sm:mb-16">
        <CoverImage
          src={facility.coverImage}
          seed={facility.slug}
          alt={facility.name}
          className="object-cover"
        />
      </div>

      <p className="eyebrow mb-4">{facility.nameEn}</p>
      <h1 className="mb-8 text-3xl font-display font-semibold sm:text-4xl md:text-5xl">
        {facility.name}
      </h1>
      <p className="mb-16 max-w-2xl text-lg leading-relaxed text-core">{facility.description}</p>

      <h2 className="mb-6 font-display text-2xl font-semibold">Peralatan</h2>
      <EquipmentTable equipment={facility.equipment} />

      {facility.modules && facility.modules.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold">Modul Praktikum Terkait</h2>
          <ul className="flex flex-wrap gap-3">
            {facility.modules.map((m) => (
              <li key={m} className="border border-line px-4 py-2 text-sm text-core">
                {m}
              </li>
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
