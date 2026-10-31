import { BottomNavigation } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function AppShell({
  children,
  className,
  showNav = true,
}: {
  children: ReactNode;
  className?: string;
  showNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-dvh w-full max-w-[var(--desktop-max-width)] overflow-hidden",
        "bg-background-secondary",
        className,
      )}
    >
      {showNav ? (
        <aside className="hidden h-full shrink-0 md:block">
          <BottomNavigation variant="rail" />
        </aside>
      ) : null}

      <div
        className={cn(
          "relative mx-auto flex h-full w-full max-w-[var(--app-max-width)] flex-col overflow-hidden",
          "bg-background shadow-[var(--shadow-subtle)]",
          "md:mx-0 md:max-w-none md:flex-1 md:border-x md:border-border md:shadow-none",
          showNav &&
            "pb-[calc(var(--nav-height)+env(safe-area-inset-bottom,0px))] md:pb-0",
        )}
      >
        {children}
      </div>

      {showNav ? (
        <div className="md:hidden">
          <BottomNavigation variant="bar" />
        </div>
      ) : null}
    </div>
  );
}
