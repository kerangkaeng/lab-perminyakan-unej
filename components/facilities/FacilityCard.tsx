import Link from "next/link";
import { Facility } from "@/types";
import { CoverImage } from "@/components/ui/CoverImage";

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link href={`/facilities/${facility.slug}`} className="group surface-hover block">
      <div className="relative aspect-[4/3] overflow-hidden bg-mist">
        <CoverImage
          src={facility.coverImage}
          seed={facility.slug}
          alt={facility.name}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <div className="border-b border-line pb-6 pt-5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-core">{facility.nameEn}</p>
        <h3 className="font-display text-xl font-semibold text-ink transition-colors group-hover:text-rig">
          {facility.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-core">{facility.shortDescription}</p>
      </div>
    </Link>
  );
}
