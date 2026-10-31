"use client";

import { Avatar, Button, EmptyState, useToast } from "@/components/ui";
import { unblockUser } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/client";
import { ShieldOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BlockedUsersView({
  users,
}: {
  users: Array<{
    friendshipId: string;
    userId: string;
    name: string;
    avatar_url: string | null;
  }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [items, setItems] = useState(users);

  async function handleUnblock(userId: string) {
    setBusyId(userId);
    const supabase = createClient();
    try {
      await unblockUser(supabase, userId);
      setItems((prev) => prev.filter((u) => u.userId !== userId));
      toast({ title: "User unblocked", tone: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't unblock",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldOff className="size-6" strokeWidth={1.75} />}
        title="No blocked users"
        description="People you block will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border/70 px-2 py-2">
      {items.map((user) => (
        <li key={user.friendshipId} className="flex items-center gap-3 px-2 py-3">
          <Avatar name={user.name} src={user.avatar_url} size="md" />
          <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-text-primary">
            {user.name}
          </p>
          <Button
            size="sm"
            variant="outline"
            loading={busyId === user.userId}
            onClick={() => handleUnblock(user.userId)}
          >
            Unblock
          </Button>
        </li>
      ))}
    </ul>
  );
}
