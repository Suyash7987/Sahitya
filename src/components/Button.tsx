import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "sm";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "sm" && "px-3.5 py-1.5 text-xs",
        variant === "primary" && "bg-forest text-card hover:bg-forest-dark",
        variant === "secondary" && "border border-line bg-card text-ink hover:border-gold",
        variant === "danger" && "bg-clay text-card hover:bg-[#843f36]",
        variant === "ghost" && "text-muted hover:bg-line/60 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
