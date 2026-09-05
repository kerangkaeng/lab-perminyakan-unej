import Link from "next/link";
import { Facility } from "@/types";

export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Link
      href={`/facilities/${facility.slug}`}
      className="group block border border-line bg-mist/30 surface-hover hover:border-petrol"
    >
      <div className="aspect-[4/3] bg-mist border-b border-line flex items-center justify-center overflow-hidden">
        <span className="font-mono text-xs text-core transition-transform duration-500 group-hover:scale-110">
          {facility.nameEn}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-rig transition-colors">
          {facility.name}
        </h3>
        <p className="mt-2 text-sm text-core leading-relaxed">{facility.shortDescription}</p>
      </div>
    </Link>
  );
}
