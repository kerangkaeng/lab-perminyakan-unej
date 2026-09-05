import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-mist border border-line p-6 shadow-card surface-hover", className)}>
      {children}
    </div>
  );
}
