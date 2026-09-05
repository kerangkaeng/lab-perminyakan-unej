import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button({ href, children, variant = "primary", className, onClick, type = "button" }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200 ease-smooth active:scale-[0.97]";
  const styles = {
    primary: "bg-petrol text-paper shadow-card hover:bg-petrol-light hover:shadow-card-hover",
    outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
    ghost: "text-petrol hover:text-rig",
  }[variant];

  if (href) {
    return (
      <Link href={href} className={cn(base, styles, className)}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cn(base, styles, className)}>
      {children}
    </button>
  );
}
