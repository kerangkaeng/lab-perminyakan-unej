import { PracticumRequestStatus } from "@/types";
import { cn } from "@/lib/utils";

const config: Record<PracticumRequestStatus, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "text-core border-line" },
  approved: { label: "Disetujui", className: "text-petrol border-petrol" },
  rejected: { label: "Ditolak", className: "text-red-700 border-red-300" },
};

export function StatusBadge({ status }: { status: PracticumRequestStatus }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-wide px-2 py-1 border whitespace-nowrap",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}
