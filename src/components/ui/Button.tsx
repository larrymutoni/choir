import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "dark" | "ghost" | "light";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-300",
    "focus:outline-none focus:ring-2 focus:ring-[#687a5e]/30 focus:ring-offset-2",
    disabled && "cursor-not-allowed opacity-60",
    variant === "primary" &&
      "bg-[#687a5e] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#56664d]",
    variant === "secondary" &&
      "border border-[#d9d3c8] bg-white text-[#1f1f1a] hover:-translate-y-0.5 hover:bg-[#f3f0e8]",
    variant === "dark" &&
      "bg-[#1f1f1a] text-white hover:-translate-y-0.5 hover:bg-black",
    variant === "light" &&
      "bg-white !text-[#1f1f1a] shadow-sm hover:-translate-y-0.5 hover:bg-[#f7f5ef]",
    variant === "ghost" && "bg-transparent text-[#1f1f1a] hover:bg-[#f3f0e8]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
