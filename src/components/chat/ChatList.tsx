"use client";

import { ChatListSkeleton, EmptyState, SearchInput } from "@/components/ui";
import { fetchConversationPreviews } from "@/lib/chat/queries";
import type { ConversationPreview } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChatListItem } from "./ChatListItem";

export function ChatList() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [conversations, setConversations] = useState<ConversationPreview[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load(initial = false) {
      if (initial) setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      try {
        const rows = await fetchConversationPreviews(supabase, user.id);
        if (!cancelled) setConversations(rows);
      } catch {
        if (!cancelled && initial) setConversations([]);
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    }

    void load(true);

    const channel = supabase
      .channel("chat-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          void load(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void load(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => {
          void load(false);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.other_user.name.toLowerCase().includes(q) ||
        c.last_message_preview.toLowerCase().includes(q),
    );
  }, [conversations, deferredQuery]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <SearchInput
          placeholder="Search chats"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          aria-label="Search chats"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <ChatListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="size-6" strokeWidth={1.75} />}
            title={query ? "No chats found" : "No conversations yet"}
            description={
              query
                ? "Try a different name or message."
                : "Start a chat with someone and your conversations will appear here."
            }
            actionLabel={query ? undefined : "New chat"}
            actionHref={query ? undefined : "/chats/new"}
          />
        ) : (
          <ul className="divide-y divide-border/70 pb-2" role="list">
            {filtered.map((conversation) => (
              <li key={conversation.id}>
                <ChatListItem conversation={conversation} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
