"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";
import { IconButton } from "./IconButton";

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ className, value, onClear, ...props }, ref) {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className={cn("relative w-full", className)}>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-text-muted"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "h-11 w-full rounded-[var(--radius-xl)] border border-transparent",
            "bg-background-secondary pr-10 pl-10",
            "text-[15px] text-text-primary placeholder:text-text-muted",
            "transition-[border-color,background-color] duration-150",
            "focus:border-border focus:bg-background focus:outline-none",
            "[&::-webkit-search-cancel-button]:hidden",
          )}
          {...props}
        />
        {hasValue && onClear ? (
          <IconButton
            label="Clear search"
            size="sm"
            tone="muted"
            onClick={onClear}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X className="size-4" strokeWidth={1.75} />
          </IconButton>
        ) : null}
      </div>
    );
  },
);
