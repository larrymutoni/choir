import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "dark";
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
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition",
    "focus:outline-none focus:ring-2 focus:ring-[#e9552f]/30 focus:ring-offset-2",
    disabled && "cursor-not-allowed opacity-60",
    variant === "primary" && "bg-[#e9552f] text-white hover:bg-[#d94c2a]",
    variant === "secondary" &&
      "border border-[#e8ded2] bg-white text-[#141414] hover:bg-[#fff1df]",
    variant === "dark" && "bg-[#202020] text-white hover:bg-black",
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
