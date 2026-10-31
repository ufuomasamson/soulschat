import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Logo size="lg" priority className="rounded-[var(--radius-xl)]" />
    </div>
  );
}

export function AuthShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-background-secondary">
      <div
        className={cn(
          "flex w-full max-w-[var(--app-max-width)] flex-col bg-background px-5 pt-10 pb-8",
          "md:my-8 md:min-h-[calc(100dvh-4rem)] md:rounded-[var(--radius-2xl)] md:border md:border-border md:shadow-[var(--shadow-subtle)]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
