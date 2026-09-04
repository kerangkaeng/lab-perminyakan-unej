import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[11px] uppercase tracking-wide px-2 py-1 border border-line text-core", className)}>
      {children}
    </span>
  );
}
