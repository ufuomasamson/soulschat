"use client";

import { Avatar, EmptyState, SearchInput } from "@/components/ui";
import { fetchConversationPreviews } from "@/lib/chat/queries";
import type { ConversationPreview } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Forward, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

export function ForwardPicker({
  excludeConversationId,
  onSelect,
  onClose,
  busy,
}: {
  excludeConversationId?: string;
  onSelect: (conversation: ConversationPreview) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const rows = await fetchConversationPreviews(supabase, user.id);
        if (!cancelled) setConversations(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return conversations
      .filter((c) => c.id !== excludeConversationId)
      .filter((c) => !q || c.other_user.name.toLowerCase().includes(q));
  }, [conversations, deferredQuery, excludeConversationId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close forward picker"
        onClick={onClose}
        disabled={busy}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[78vh] w-full max-w-md flex-col",
          "rounded-t-[var(--radius-2xl)] bg-background shadow-[var(--shadow-subtle)]",
          "sm:rounded-[var(--radius-2xl)]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Forward className="size-4 text-primary" strokeWidth={1.75} />
            <h2 className="text-[16px] font-semibold text-text-primary">
              Forward to
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)] text-text-secondary hover:bg-background-secondary"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-4 py-3">
          <SearchInput
            placeholder="Search chats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            aria-label="Search chats"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          {loading ? (
            <p className="py-8 text-center text-[14px] text-text-secondary">
              Loading chats...
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No chats to forward to"
              description="Start a conversation first, then try again."
            />
          ) : (
            <ul>
              {filtered.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelect(conversation)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left",
                      "hover:bg-background-secondary disabled:opacity-60",
                    )}
                  >
                    <Avatar
                      name={conversation.other_user.name}
                      src={conversation.other_user.avatar_url}
                      size="md"
                    />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-text-primary">
                      {conversation.other_user.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
