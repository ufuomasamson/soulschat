"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5">
      {label ? (
        <span className="text-[13px] font-medium text-text-primary">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-11 w-full rounded-[var(--radius-xl)] border bg-background px-3.5",
          "text-[15px] text-text-primary placeholder:text-text-muted",
          "transition-[border-color,box-shadow] duration-150",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
          error ? "border-error" : "border-border",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <span className="text-[12px] text-error">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
});
