"use client";

import { Avatar, Button, EmptyState, TopBar, useToast } from "@/components/ui";
import { startDirectConversation } from "@/lib/chat/actions";
import { formatLastSeen } from "@/lib/chat/time";
import {
  removeFriend,
  respondFriendRequest,
} from "@/lib/friends/actions";
import {
  fetchFriendRequests,
  fetchFriends,
} from "@/lib/friends/queries";
import type { FriendListItem, FriendRequestItem } from "@/lib/friends/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Tab = "all" | "online" | "requests";

export function FriendsView() {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("all");
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const load = useCallback(async (uid: string, initial = false) => {
    if (initial) setLoading(true);
    const supabase = createClient();
    try {
      const [friendRows, requestRows] = await Promise.all([
        fetchFriends(supabase, uid),
        fetchFriendRequests(supabase, uid),
      ]);
      setFriends(friendRows);
      setRequests(requestRows);
    } catch (err) {
      toast({
        title: "Couldn't load friends",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      if (initial) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function boot() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }
      userIdRef.current = user.id;
      await load(user.id, true);
    }

    void boot();

    const channel = supabase
      .channel("friends-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friends" },
        () => {
          if (userIdRef.current) void load(userIdRef.current, false);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          if (userIdRef.current) void load(userIdRef.current, false);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const incomingCount = useMemo(
    () => requests.filter((r) => r.direction === "incoming").length,
    [requests],
  );

  const onlineFriends = useMemo(
    () => friends.filter((f) => f.profile.online_status),
    [friends],
  );

  const visibleFriends = tab === "online" ? onlineFriends : friends;
  const incoming = requests.filter((r) => r.direction === "incoming");
  const outgoing = requests.filter((r) => r.direction === "outgoing");

  async function messageFriend(profileId: string) {
    setBusyId(profileId);
    const supabase = createClient();
    try {
      const conversationId = await startDirectConversation(supabase, profileId);
      router.push(`/chats/${conversationId}`);
    } catch (err) {
      toast({
        title: "Couldn't open chat",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function acceptRequest(requestId: string) {
    setBusyId(requestId);
    const supabase = createClient();
    try {
      await respondFriendRequest(supabase, requestId, true);
      toast({ title: "Friend request accepted", tone: "success" });
      if (userIdRef.current) await load(userIdRef.current, false);
    } catch (err) {
      toast({
        title: "Couldn't accept",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function declineRequest(requestId: string) {
    setBusyId(requestId);
    const supabase = createClient();
    try {
      await respondFriendRequest(supabase, requestId, false);
      toast({ title: "Request declined" });
      if (userIdRef.current) await load(userIdRef.current, false);
    } catch (err) {
      toast({
        title: "Couldn't decline",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function unfriend(profileId: string) {
    setBusyId(profileId);
    const supabase = createClient();
    try {
      await removeFriend(supabase, profileId);
      toast({ title: "Removed from friends" });
      if (userIdRef.current) await load(userIdRef.current, false);
    } catch (err) {
      toast({
        title: "Couldn't remove",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar title="Friends" bordered={false} className="px-3" />

      <div className="flex gap-2 px-4 pb-3">
        {(
          [
            { id: "all", label: "All" },
            { id: "online", label: "Online" },
            { id: "requests", label: "Requests" },
          ] as const
        ).map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-primary text-text-inverse"
                  : "bg-background-secondary text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
              {item.id === "requests" && incomingCount > 0 ? (
                <span
                  className={cn(
                    "inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                    active
                      ? "bg-background text-primary"
                      : "bg-primary text-text-inverse",
                  )}
                >
                  {incomingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-10 text-center text-[14px] text-text-secondary">
            Loading friends...
          </p>
        ) : tab === "requests" ? (
          incoming.length === 0 && outgoing.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" strokeWidth={1.75} />}
              title="No requests"
              description="When someone wants to connect, their request will show up here."
              actionLabel="Discover People"
              actionHref="/feed"
            />
          ) : (
            <div className="space-y-6 px-4 pb-6">
              {incoming.length > 0 ? (
                <section>
                  <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-text-muted uppercase">
                    Incoming
                  </h2>
                  <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
                    {incoming.map((request) => (
                      <li
                        key={request.friendshipId}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <Avatar
                          name={request.profile.name}
                          src={request.profile.avatar_url}
                          online={request.profile.online_status}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-text-primary">
                            {request.profile.name}
                          </p>
                          <p className="text-[13px] text-text-secondary">
                            wants to be your friend
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            loading={busyId === request.friendshipId}
                            onClick={() => acceptRequest(request.friendshipId)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === request.friendshipId}
                            onClick={() => declineRequest(request.friendshipId)}
                          >
                            Decline
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {outgoing.length > 0 ? (
                <section>
                  <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-text-muted uppercase">
                    Sent
                  </h2>
                  <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
                    {outgoing.map((request) => (
                      <li
                        key={request.friendshipId}
                        className="flex items-center gap-3 px-3 py-3"
                      >
                        <Avatar
                          name={request.profile.name}
                          src={request.profile.avatar_url}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-text-primary">
                            {request.profile.name}
                          </p>
                          <p className="text-[13px] text-text-secondary">
                            Request pending
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )
        ) : visibleFriends.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" strokeWidth={1.75} />}
            title={tab === "online" ? "No friends online" : "No friends yet"}
            description={
              tab === "online"
                ? "None of your friends are online right now."
                : "Discover people and start making new connections."
            }
            actionLabel="Discover People"
            actionHref="/feed"
          />
        ) : (
          <ul className="divide-y divide-border/70 pb-4" role="list">
            {visibleFriends.map((friend) => (
              <li
                key={friend.friendshipId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => router.push(`/users/${friend.profile.id}`)}
                >
                  <Avatar
                    name={friend.profile.name}
                    src={friend.profile.avatar_url}
                    online={friend.profile.online_status}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium text-text-primary">
                      {friend.profile.name}
                    </p>
                    <p className="truncate text-[13px] text-text-secondary">
                      {formatLastSeen(
                        friend.profile.last_seen,
                        friend.profile.online_status,
                      )}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    loading={busyId === friend.profile.id}
                    onClick={() => messageFriend(friend.profile.id)}
                  >
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === friend.profile.id}
                    onClick={() => unfriend(friend.profile.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
