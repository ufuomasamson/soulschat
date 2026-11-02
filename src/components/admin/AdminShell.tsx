"use client";

import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Flag,
  LayoutDashboard,
  Link2,
  LogOut,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/links", label: "Advert links", icon: Link2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] bg-background-secondary">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-background md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Logo variant="icon" size="sm" className="rounded-lg" />
          <div>
            <p className="text-[14px] font-semibold text-text-primary">Admin</p>
            <p className="text-[11px] text-text-muted">SoulsChat</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-lg)] px-3 py-2.5 text-[14px] font-medium",
                  active
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background-secondary hover:text-text-primary",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/chats"
            className="inline-flex w-full items-center gap-2 rounded-[var(--radius-lg)] px-3 py-2.5 text-[14px] text-text-secondary hover:bg-background-secondary"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Back to app
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          <Logo variant="icon" size="sm" className="rounded-md" />
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium",
                  active
                    ? "bg-primary text-text-inverse"
                    : "bg-background-secondary text-text-secondary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/chats"
            className="shrink-0 rounded-full bg-background-secondary px-3 py-1.5 text-[12px] font-medium text-text-secondary"
          >
            App
          </Link>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
