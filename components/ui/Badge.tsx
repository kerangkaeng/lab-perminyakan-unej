import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-wide text-core",
        "before:content-['·'] before:mr-1.5 before:text-rig first:before:content-none",
        className
      )}
    >
      {children}
    </span>
  );
}
