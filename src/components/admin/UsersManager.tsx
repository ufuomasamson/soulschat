"use client";

import { Avatar, Button, SearchInput, useToast } from "@/components/ui";
import {
  adminDeleteUsers,
  adminSetUserAdmin,
  adminSetUserDisabled,
} from "@/lib/admin/actions";
import type { AdminUserRow } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

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

  const selectableFiltered = useMemo(
    () => filtered.filter((u) => u.id !== currentUserId),
    [filtered, currentUserId],
  );

  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((u) => selected.has(u.id));

  function toggleSelected(userId: string) {
    if (userId === currentUserId) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const u of selectableFiltered) next.delete(u.id);
      } else {
        for (const u of selectableFiltered) next.add(u.id);
      }
      return next;
    });
  }

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

  async function deleteUsers(ids: string[]) {
    const targets = [...new Set(ids)].filter((id) => id !== currentUserId);
    if (!targets.length) {
      toast({
        title: "Nothing to delete",
        description: "You can't delete your own account.",
        tone: "error",
      });
      return;
    }

    const label =
      targets.length === 1
        ? users.find((u) => u.id === targets[0])?.name || "this user"
        : `${targets.length} users`;

    if (
      !window.confirm(
        `Delete ${label}? This permanently removes their account, chats, and related data. This cannot be undone.`,
      )
    ) {
      return;
    }

    if (targets.length === 1) setBusyId(targets[0]);
    else setBulkBusy(true);

    const supabase = createClient();
    try {
      const result = await adminDeleteUsers(supabase, targets);
      const deleted = new Set(result.deleted_ids ?? targets);
      setUsers((prev) => prev.filter((u) => !deleted.has(u.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of deleted) next.delete(id);
        return next;
      });
      toast({
        title:
          result.deleted_count === 1
            ? "User deleted"
            : `${result.deleted_count} users deleted`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
      setBulkBusy(false);
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-[13px] text-text-secondary">
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-[var(--color-primary)]"
            checked={allFilteredSelected}
            disabled={selectableFiltered.length === 0 || bulkBusy}
            onChange={toggleSelectAllFiltered}
          />
          Select all
          {selected.size > 0 ? (
            <span className="text-text-muted">({selected.size} selected)</span>
          ) : null}
        </label>

        <Button
          size="sm"
          variant="danger"
          disabled={selected.size === 0 || bulkBusy}
          loading={bulkBusy}
          onClick={() => void deleteUsers([...selected])}
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Delete selected
        </Button>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
        {filtered.map((user) => {
          const isSelf = user.id === currentUserId;
          const isChecked = selected.has(user.id);
          const rowBusy = busyId === user.id || bulkBusy;

          return (
            <li
              key={user.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 rounded border-border accent-[var(--color-primary)]"
                  checked={isChecked}
                  disabled={isSelf || bulkBusy}
                  onChange={() => toggleSelected(user.id)}
                  aria-label={`Select ${user.name}`}
                />
                <Avatar name={user.name} src={user.avatar_url} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-text-primary">
                    {user.name}
                    {isSelf ? (
                      <span className="ml-1 text-[12px] font-normal text-text-muted">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[12px] text-text-secondary">
                    {user.email || "No email"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {user.is_admin ? <Chip tone="primary">Admin</Chip> : null}
                    {user.is_guest ? <Chip>Guest</Chip> : null}
                    {user.is_disabled ? (
                      <Chip tone="danger">Disabled</Chip>
                    ) : null}
                    {user.online_status ? (
                      <Chip tone="success">Online</Chip>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-7 sm:pl-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSelf || user.is_guest || rowBusy}
                  loading={busyId === user.id}
                  onClick={() => void toggleAdmin(user)}
                >
                  {user.is_admin ? "Remove admin" : "Make admin"}
                </Button>
                <Button
                  size="sm"
                  variant={user.is_disabled ? "secondary" : "danger"}
                  disabled={isSelf || rowBusy}
                  loading={busyId === user.id}
                  onClick={() => void toggleDisabled(user)}
                >
                  {user.is_disabled ? "Enable" : "Disable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSelf || rowBusy}
                  loading={busyId === user.id}
                  onClick={() => void deleteUsers([user.id])}
                  className="text-error hover:bg-error/10"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
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
