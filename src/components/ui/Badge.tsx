import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "primary" | "muted" | "success" | "error";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  count?: number | string;
  max?: number;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary text-text-inverse",
  muted: "bg-background-secondary text-text-secondary",
  success: "bg-success text-text-inverse",
  error: "bg-error text-text-inverse",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "min-w-[18px] h-[18px] px-1 text-[11px]",
  md: "min-w-[20px] h-5 px-1.5 text-[12px]",
};

export function Badge({
  className,
  variant = "primary",
  size = "sm",
  count,
  max = 99,
  dot,
  children,
  ...props
}: BadgeProps) {
  if (dot) {
    return (
      <span
        className={cn(
          "inline-block size-2 rounded-full bg-primary",
          className,
        )}
        aria-hidden
        {...props}
      />
    );
  }

  const display =
    typeof count === "number"
      ? count > max
        ? `${max}+`
        : String(count)
      : count ?? children;

  if (display === undefined || display === null || display === "") {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold leading-none tabular-nums",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {display}
    </span>
  );
}
