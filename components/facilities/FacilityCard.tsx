import Link from "next/link";
import { Facility } from "@/types";

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link
      href={`/facilities/${facility.slug}`}
      className="group block border border-line hover:border-petrol transition-colors"
    >
      <div className="aspect-[4/3] bg-mist border-b border-line flex items-center justify-center">
        <span className="font-mono text-xs text-core">{facility.nameEn}</span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-rig transition-colors">
          {facility.name}
        </h3>
        <p className="mt-2 text-sm text-core">{facility.shortDescription}</p>
      </div>
    </Link>
  );
}
