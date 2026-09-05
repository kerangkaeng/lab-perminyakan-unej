import Link from "next/link";
import { Facility } from "@/types";

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link href={`/facilities/${facility.slug}`} className="group surface-hover block">
      <div className="aspect-[4/3] overflow-hidden bg-mist">
        <span className="flex h-full items-center justify-center font-mono text-xs text-core transition-transform duration-700 group-hover:scale-110">
          {facility.nameEn}
        </span>
      </div>
      <div className="border-b border-line pb-6 pt-5">
        <h3 className="font-display text-xl font-semibold text-ink transition-colors group-hover:text-rig">
          {facility.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-core">{facility.shortDescription}</p>
      </div>
    </Link>
  );
}
