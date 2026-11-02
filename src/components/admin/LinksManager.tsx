"use client";

import { Button, useToast } from "@/components/ui";
import { adminSetLinkActive } from "@/lib/admin/actions";
import type { AdminLinkRow } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function LinksManager({ initialLinks }: { initialLinks: AdminLinkRow[] }) {
  const { toast } = useToast();
  const [links, setLinks] = useState(initialLinks);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(link: AdminLinkRow) {
    setBusyId(link.id);
    const supabase = createClient();
    try {
      await adminSetLinkActive(supabase, link.id, !link.is_active);
      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id ? { ...l, is_active: !l.is_active } : l,
        ),
      );
      toast({
        title: link.is_active ? "Link deactivated" : "Link activated",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update link",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
      {links.map((link) => (
        <li
          key={link.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-text-primary">
              /c/{link.slug}
            </p>
            <p className="mt-0.5 text-[13px] text-text-secondary">
              {link.owner?.name ?? "Unknown"} · {link.visit_count} visits ·{" "}
              {link.guest_chats} guests
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                link.is_active
                  ? "bg-success/10 text-success"
                  : "bg-background-secondary text-text-secondary",
              )}
            >
              {link.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <Button
            size="sm"
            variant={link.is_active ? "danger" : "secondary"}
            loading={busyId === link.id}
            onClick={() => void toggle(link)}
          >
            {link.is_active ? "Deactivate" : "Activate"}
          </Button>
        </li>
      ))}
      {links.length === 0 ? (
        <li className="p-8 text-center text-[14px] text-text-secondary">
          No private chat links yet.
        </li>
      ) : null}
    </ul>
  );
}
