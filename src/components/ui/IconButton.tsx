"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: IconButtonSize;
  tone?: "default" | "primary" | "muted";
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "size-9 rounded-[var(--radius-md)]",
  md: "size-10 rounded-[var(--radius-lg)]",
  lg: "size-11 rounded-[var(--radius-xl)]",
};

const toneStyles = {
  default:
    "text-text-primary hover:bg-background-secondary active:bg-background-chat",
  primary: "text-primary hover:bg-primary-light active:bg-[#f8e4e6]",
  muted: "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      label,
      size = "md",
      tone = "default",
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
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center transition-colors duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeStyles[size],
          toneStyles[tone],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
