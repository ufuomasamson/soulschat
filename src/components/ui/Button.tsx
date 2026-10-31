"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-inverse hover:bg-primary-dark active:bg-primary-dark disabled:bg-primary/50",
  secondary:
    "bg-primary-light text-primary hover:bg-[#f8e4e6] active:bg-[#f3d5d8] disabled:opacity-50",
  ghost:
    "bg-transparent text-text-primary hover:bg-background-secondary active:bg-background-chat disabled:opacity-50",
  danger:
    "bg-error text-text-inverse hover:bg-[#dc2626] active:bg-[#b91c1c] disabled:opacity-50",
  outline:
    "bg-transparent text-text-primary border border-border hover:bg-background-secondary active:bg-background-chat disabled:opacity-50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-[var(--radius-md)]",
  md: "h-11 px-4 text-[15px] gap-2 rounded-[var(--radius-xl)]",
  lg: "h-12 px-5 text-[16px] gap-2 rounded-[var(--radius-xl)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-150",
          "disabled:cursor-not-allowed select-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
        ) : null}
        {children}
      </button>
    );
  },
);
