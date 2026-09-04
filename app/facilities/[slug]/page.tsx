import { notFound } from "next/navigation";
import { facilities, getFacilityBySlug } from "@/data/facilities";
import { EquipmentTable } from "@/components/facilities/EquipmentTable";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return facilities.map((f) => ({ slug: f.slug }));
}

export default function FacilityDetailPage({ params }: { params: { slug: string } }) {
  const facility = getFacilityBySlug(params.slug);
  if (!facility) return notFound();

  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">{facility.nameEn}</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-6">{facility.name}</h1>
      <p className="text-core max-w-2xl mb-10">{facility.description}</p>

      <h2 className="font-display text-xl font-semibold mb-4">Peralatan</h2>
      <EquipmentTable equipment={facility.equipment} />

      {facility.modules && facility.modules.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold mb-4">Modul Praktikum Terkait</h2>
          <ul className="flex flex-wrap gap-3">
            {facility.modules.map((m) => (
              <li key={m} className="border border-line px-4 py-2 text-sm text-core">{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-12">
        <Button href="/practicum">Lihat Jadwal Praktikum</Button>
      </div>
    </div>
  );
}
