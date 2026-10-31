import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  bordered?: boolean;
  /** Messaging-style left title (default) vs centered title */
  align?: "left" | "center";
}

export function TopBar({
  title,
  subtitle,
  left,
  right,
  className,
  bordered = true,
  align = "left",
}: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center gap-2",
        "min-h-[var(--topbar-height)] bg-background/95 px-2 backdrop-blur-md",
        bordered && "border-b border-border",
        className,
      )}
    >
      {left ? <div className="flex shrink-0 items-center">{left}</div> : null}

      <div
        className={cn(
          "min-w-0 flex-1",
          align === "center" && "text-center",
          align === "left" && "pl-2",
        )}
      >
        <h1 className="truncate text-[22px] font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-[13px] text-text-secondary">{subtitle}</p>
        ) : null}
      </div>

      {right ? (
        <div className="flex shrink-0 items-center justify-end gap-0.5">
          {right}
        </div>
      ) : null}
    </header>
  );
}
