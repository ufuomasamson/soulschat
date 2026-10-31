import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
}

/**
 * Use sparingly — only when a bordered container aids interaction or grouping.
 * Prefer flat list rows for chats/friends.
 */
export function Card({
  className,
  padded = true,
  interactive,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-2xl)] border border-border bg-background",
        padded && "p-4",
        interactive &&
          "transition-colors duration-150 hover:bg-background-secondary active:bg-background-chat",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
