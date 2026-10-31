"use client";

import {
  EmptyState,
  SearchInput,
  TopBar,
  useToast,
} from "@/components/ui";
import { fetchDiscoverPeople } from "@/lib/friends/queries";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type DiscoverPerson = Awaited<ReturnType<typeof fetchDiscoverPeople>>[number];

export function DiscoverView() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [people, setPeople] = useState<DiscoverPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const load = useCallback(
    async (uid: string, initial = false) => {
      if (initial) setLoading(true);
      const supabase = createClient();
      try {
        const rows = await fetchDiscoverPeople(supabase, uid);
        setPeople(rows);
      } catch (err) {
        toast({
          title: "Couldn't load people",
          description: err instanceof Error ? err.message : "Try again.",
          tone: "error",
        });
      } finally {
        if (initial) setLoading(false);
      }
    },
    [toast],
  );

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
      .channel("discover-friends")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friends" },
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

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.interests.some((i) => i.toLowerCase().includes(q)),
    );
  }, [people, deferredQuery]);

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Discover"
        subtitle="Meet new people and make new connections."
        bordered={false}
        className="h-auto min-h-[var(--topbar-height)] px-3 py-3"
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="aspect-square animate-pulse rounded-[var(--radius-lg)] bg-background-secondary" />
                <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-background-secondary" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Compass className="size-6" strokeWidth={1.75} />}
            title="No new people right now"
            description="Check back later for new people to discover."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filtered.map((person) => (
              <PersonTile key={person.id} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonTile({ person }: { person: DiscoverPerson }) {
  const initials = getInitials(person.name);

  return (
    <Link
      href={`/users/${person.id}`}
      className={cn(
        "group flex flex-col gap-1.5 rounded-[var(--radius-lg)] outline-none",
        "transition-transform active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      <span className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-primary-light">
        {person.avatar_url ? (
          <Image
            src={person.avatar_url}
            alt={person.name}
            fill
            sizes="(max-width: 640px) 33vw, 180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            className="flex size-full items-center justify-center text-[22px] font-semibold text-primary sm:text-[28px]"
            aria-hidden
          >
            {initials}
          </span>
        )}
        {person.online_status ? (
          <span
            className="absolute right-1.5 bottom-1.5 size-2.5 rounded-full bg-success ring-2 ring-background"
            aria-label="Online"
          />
        ) : null}
      </span>
      <span className="truncate px-0.5 text-center text-[12px] font-medium text-text-primary sm:text-[13px]">
        {person.name}
      </span>
    </Link>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
