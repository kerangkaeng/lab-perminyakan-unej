import { facilities } from "@/data/facilities";
import { FacilityCard } from "@/components/facilities/FacilityCard";

export default function FacilitiesPage() {
  return (
    <div className="container-lab py-16">
      <p className="eyebrow mb-3">Fasilitas Laboratorium</p>
      <h1 className="text-3xl md:text-4xl font-display font-semibold mb-4">Facilities</h1>
      <p className="text-core max-w-2xl mb-12">
        Tiga laboratorium mendukung kegiatan praktikum dan penelitian mahasiswa,
        masing-masing dengan peralatan sesuai standar industri.
      </p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <FacilityCard key={f.slug} facility={f} />
        ))}
      </div>
    </div>
  );
}
