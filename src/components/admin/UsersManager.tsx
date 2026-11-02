"use client";

import { Avatar, Button, SearchInput, useToast } from "@/components/ui";
import {
  adminSetUserAdmin,
  adminSetUserDisabled,
} from "@/lib/admin/actions";
import type { AdminUserRow } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useDeferredValue, useMemo, useState } from "react";

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUserRow[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q),
    );
  }, [users, deferredQuery]);

  async function toggleAdmin(user: AdminUserRow) {
    if (user.id === currentUserId) return;
    setBusyId(user.id);
    const supabase = createClient();
    try {
      await adminSetUserAdmin(supabase, user.id, !user.is_admin);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_admin: !u.is_admin } : u,
        ),
      );
      toast({
        title: user.is_admin ? "Admin removed" : "Admin granted",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update admin",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDisabled(user: AdminUserRow) {
    if (user.id === currentUserId) return;
    setBusyId(user.id);
    const supabase = createClient();
    try {
      await adminSetUserDisabled(supabase, user.id, !user.is_disabled);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                is_disabled: !u.is_disabled,
                is_admin: !u.is_disabled ? false : u.is_admin,
                online_status: !u.is_disabled ? false : u.online_status,
              }
            : u,
        ),
      );
      toast({
        title: user.is_disabled ? "User enabled" : "User disabled",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update user",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        aria-label="Search users"
      />

      <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
        {filtered.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={user.name} src={user.avatar_url} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-text-primary">
                  {user.name}
                </p>
                <p className="truncate text-[12px] text-text-secondary">
                  {user.email || "No email"}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {user.is_admin ? <Chip tone="primary">Admin</Chip> : null}
                  {user.is_guest ? <Chip>Guest</Chip> : null}
                  {user.is_disabled ? <Chip tone="danger">Disabled</Chip> : null}
                  {user.online_status ? <Chip tone="success">Online</Chip> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={user.id === currentUserId || user.is_guest || busyId === user.id}
                loading={busyId === user.id}
                onClick={() => void toggleAdmin(user)}
              >
                {user.is_admin ? "Remove admin" : "Make admin"}
              </Button>
              <Button
                size="sm"
                variant={user.is_disabled ? "secondary" : "danger"}
                disabled={user.id === currentUserId || busyId === user.id}
                loading={busyId === user.id}
                onClick={() => void toggleDisabled(user)}
              >
                {user.is_disabled ? "Enable" : "Disable"}
              </Button>
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="p-8 text-center text-[14px] text-text-secondary">
            No users found.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Chip({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "primary" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "primary" && "bg-primary-light text-primary",
        tone === "danger" && "bg-error/10 text-error",
        tone === "success" && "bg-success/10 text-success",
        tone === "muted" && "bg-background-secondary text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}
