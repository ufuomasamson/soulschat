"use client";

import { cn } from "@/lib/utils";
import { Compass, MessageCircle, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const tabs = [
  {
    href: "/chats",
    label: "Chats",
    icon: MessageCircle,
    match: (path: string) => path.startsWith("/chats"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
    match: (path: string) => path.startsWith("/friends"),
  },
  {
    href: "/feed",
    label: "Feed",
    icon: Compass,
    match: (path: string) => path.startsWith("/feed"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (path: string) => path.startsWith("/settings"),
  },
] as const;

function TabList({
  pathname,
  layout,
}: {
  pathname: string;
  layout: "bar" | "rail";
}) {
  return (
    <ul
      className={
        layout === "rail"
          ? "flex flex-col gap-1 px-2"
          : "mx-auto flex h-[var(--nav-height)] max-w-[var(--app-max-width)] items-stretch justify-around px-1"
      }
    >
      {tabs.map((tab) => {
        const active = pathname ? tab.match(pathname) : false;
        const Icon = tab.icon;
        return (
          <li
            key={tab.href}
            className={layout === "bar" ? "flex flex-1" : undefined}
          >
            <Link
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "text-[11px] font-medium transition-colors duration-150",
                layout === "bar" && "flex-1",
                layout === "rail" &&
                  "h-14 w-full rounded-[var(--radius-lg)]",
                active
                  ? layout === "rail"
                    ? "bg-primary-light text-primary"
                    : "text-primary"
                  : layout === "rail"
                    ? "text-text-muted hover:bg-background-secondary hover:text-text-secondary"
                    : "text-text-muted hover:text-text-secondary",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="size-[22px]"
                strokeWidth={active ? 2.15 : 1.75}
              />
              <span>{tab.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BottomNavigation({
  variant = "bar",
}: {
  variant?: "bar" | "rail";
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePath = mounted ? pathname : "";

  if (variant === "rail") {
    return (
      <nav
        className="flex h-full w-[72px] flex-col border-r border-border bg-background pt-4"
        aria-label="Primary"
      >
        <TabList pathname={activePath} layout="rail" />
      </nav>
    );
  }

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background",
        "pb-safe shadow-[var(--shadow-nav)]",
      )}
      aria-label="Primary"
    >
      <TabList pathname={activePath} layout="bar" />
    </nav>
  );
}
