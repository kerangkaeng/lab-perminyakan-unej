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
    "inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] text-sm tracking-wide font-medium transition-all duration-300 ease-smooth active:scale-[0.97]";
  const styles = {
    primary: "bg-petrol text-paper hover:bg-petrol-light",
    outline: "border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-paper",
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
