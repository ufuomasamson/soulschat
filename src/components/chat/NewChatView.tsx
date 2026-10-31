"use client";

import { Avatar, EmptyState, SearchInput, TopBar, useToast } from "@/components/ui";
import { startDirectConversation } from "@/lib/chat/actions";
import { listPeopleToMessage } from "@/lib/chat/queries";
import type { ProfileSummary } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

export function NewChatView() {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [people, setPeople] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setPeople([]);
          setLoading(false);
        }
        return;
      }

      try {
        const rows = await listPeopleToMessage(supabase, user.id);
        if (!cancelled) setPeople(rows);
      } catch {
        if (!cancelled) setPeople([]);
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
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [people, deferredQuery]);

  async function openChat(person: ProfileSummary) {
    setStartingId(person.id);
    const supabase = createClient();
    try {
      const conversationId = await startDirectConversation(supabase, person.id);
      router.push(`/chats/${conversationId}`);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't start chat",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
      setStartingId(null);
    }
  }

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar
        title="New chat"
        bordered={false}
        className="pr-2 pl-1"
        left={
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-text-primary hover:bg-background-secondary"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        }
      />

      <div className="px-4 pb-3">
        <SearchInput
          placeholder="Search people"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          aria-label="Search people"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-8 text-center text-[14px] text-text-secondary">
            Loading people...
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" strokeWidth={1.75} />}
            title="No one to message yet"
            description="When more people join SoulsChat, they'll show up here. Create a second account to test chatting."
            actionLabel="Discover People"
            actionHref="/feed"
          />
        ) : (
          <ul role="list">
            {filtered.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  disabled={startingId === person.id}
                  onClick={() => openChat(person)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left",
                    "transition-colors hover:bg-background-secondary active:bg-background-chat",
                    "disabled:opacity-60",
                  )}
                >
                  <Avatar
                    name={person.name}
                    src={person.avatar_url}
                    online={person.online_status}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium text-text-primary">
                      {person.name}
                    </p>
                    <p className="text-[13px] text-text-secondary">
                      {startingId === person.id
                        ? "Opening chat..."
                        : person.online_status
                          ? "Online"
                          : "Tap to message"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
