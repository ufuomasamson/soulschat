"use client";

import { trackFacebookEvent } from "@/components/advert/FacebookPixel";
import { GuestChatPanel } from "@/components/advert/GuestChatPanel";
import { Avatar, Button, Input, Logo, useToast } from "@/components/ui";
import { getAgeFromDob, RELATIONSHIP_OPTIONS } from "@/lib/auth/constants";
import {
  ensureGuestSession,
  fetchPrivateLinkLanding,
  readStoredGuestEmail,
  readStoredGuestName,
  startPrivateLinkChat,
} from "@/lib/advert/actions";
import type { PrivateLinkLanding } from "@/lib/advert/types";
import { looksLikeEmail } from "@/lib/auth/constants";
import { formatLastSeen } from "@/lib/chat/time";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MapPin, MessageCircle, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "profile" | "chat";

export function GuestLinkExperience({ slug }: { slug: string }) {
  const { toast } = useToast();
  const [landing, setLanding] = useState<PrivateLinkLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [joining, setJoining] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [needsDetails, setNeedsDetails] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPrivateLinkLanding(supabase, slug);
        if (cancelled) return;
        if (!data) {
          setError("This chat link is unavailable.");
          setLoading(false);
          return;
        }
        setLanding(data);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id === data.owner.id) {
          setIsOwner(true);
          setNeedsDetails(false);
          setCurrentUserId(user.id);
          setLoading(false);
          return;
        }

        const storedName = readStoredGuestName(slug);
        const storedEmail = readStoredGuestEmail(slug);
        if (storedName) setGuestName(storedName);
        if (storedEmail) setGuestEmail(storedEmail);

        if (user) {
          setCurrentUserId(user.id);
          const isGuest =
            user.user_metadata?.is_guest === true ||
            (user.email || "").endsWith("@guests.soulschat.local");

          if (isGuest) {
            if (storedName && storedEmail) {
              try {
                const chat = await startPrivateLinkChat(
                  supabase,
                  slug,
                  storedName,
                  storedEmail,
                );
                if (!cancelled) {
                  setConversationId(chat.conversation_id);
                  setNeedsDetails(false);
                  setTab("chat");
                }
              } catch {
                setNeedsDetails(true);
              }
            } else {
              setNeedsDetails(true);
            }
          } else {
            // Logged-in SoulsChat member: start chat with their account
            try {
              const chat = await startPrivateLinkChat(
                supabase,
                slug,
                user.user_metadata?.name || "Member",
                user.email,
              );
              if (!cancelled) {
                setConversationId(chat.conversation_id);
                setNeedsDetails(false);
                setCurrentUserId(user.id);
                setTab("chat");
              }
            } catch {
              setNeedsDetails(true);
            }
          }
        } else if (storedName && storedEmail) {
          setNeedsDetails(true);
        } else {
          setNeedsDetails(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Couldn't load link.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const owner = landing?.owner;
  const age = owner ? getAgeFromDob(owner.date_of_birth) : null;
  const intentionLabel = RELATIONSHIP_OPTIONS.find(
    (o) => o.value === owner?.relationship_intention,
  )?.label;

  const statusText = useMemo(() => {
    if (!owner) return null;
    if (!owner.show_online_status && !owner.show_last_seen) return null;
    if (owner.show_online_status && owner.online_status) return "online";
    if (owner.show_last_seen) {
      return formatLastSeen(
        owner.last_seen,
        owner.show_online_status && owner.online_status,
      );
    }
    return null;
  }, [owner]);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!landing) return;
    if (guestName.trim().length < 2) {
      toast({ title: "Enter your name", tone: "error" });
      return;
    }
    if (!looksLikeEmail(guestEmail)) {
      toast({ title: "Enter a valid email", tone: "error" });
      return;
    }
    setJoining(true);
    const supabase = createClient();
    try {
      const session = await ensureGuestSession(
        supabase,
        slug,
        guestName,
        guestEmail,
      );
      const chat = await startPrivateLinkChat(
        supabase,
        slug,
        guestName.trim(),
        guestEmail.trim(),
      );
      setCurrentUserId(session.userId);
      setConversationId(chat.conversation_id);
      setNeedsDetails(false);
      setTab("chat");
      void trackFacebookEvent(
        "Lead",
        { content_name: "private_chat_guest" },
        landing.owner.facebook_pixel_id,
        {
          em: guestEmail.trim().toLowerCase(),
          fn: guestName.trim().toLowerCase(),
        },
      );
    } catch (err) {
      toast({
        title: "Couldn't start chat",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-[14px] text-text-secondary">
        Loading...
      </div>
    );
  }

  if (error || !landing || !owner) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <p className="text-[16px] font-semibold text-text-primary">
          Link unavailable
        </p>
        <p className="text-[14px] text-text-secondary">
          {error ?? "This private chat link is inactive or invalid."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[var(--app-max-width)] flex-col bg-background">
      <div className="flex justify-center border-b border-border bg-black px-4 py-2.5">
        <Logo size="sm" className="h-9" />
      </div>

      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar name={owner.name} src={owner.avatar_url} size="md" online={owner.show_online_status && owner.online_status} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-semibold text-text-primary">
            {owner.name}
            {age ? `, ${age}` : ""}
          </h1>
          {statusText ? (
            <p className="truncate text-[12px] text-text-secondary">{statusText}</p>
          ) : (
            <p className="truncate text-[12px] text-text-secondary">
              Private chat
            </p>
          )}
        </div>
      </header>

      {isOwner ? (
        <div className="border-b border-border bg-primary-light px-4 py-3 text-[13px] text-text-primary">
          This is your advert link preview. Guests will enter their name and
          email here, then chat with you.
        </div>
      ) : null}

      {!isOwner && !needsDetails ? (
        <div className="grid grid-cols-2 border-b border-border">
          <TabButton
            active={tab === "profile"}
            onClick={() => setTab("profile")}
            icon={<UserRound className="size-4" strokeWidth={1.75} />}
            label="Profile"
          />
          <TabButton
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            icon={<MessageCircle className="size-4" strokeWidth={1.75} />}
            label="Chat"
          />
        </div>
      ) : null}

      {needsDetails && !isOwner ? (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <OwnerProfile
            owner={owner}
            media={landing.media}
            age={age}
            intentionLabel={intentionLabel}
            pixelId={owner.facebook_pixel_id}
            onOpenPhoto={setLightboxUrl}
          />
          <div className="sticky bottom-0 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <form onSubmit={handleJoin} className="space-y-3">
              <Input
                label="Your name"
                name="guest_name"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
              <Input
                label="Your email"
                name="guest_email"
                type="email"
                placeholder="you@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Button type="submit" fullWidth loading={joining}>
                Start chatting
              </Button>
              <p className="text-center text-[12px] text-text-muted">
                No account needed. You&apos;ll join as a guest.
              </p>
            </form>
          </div>
        </div>
      ) : tab === "chat" && conversationId && currentUserId ? (
        <GuestChatPanel
          conversationId={conversationId}
          currentUserId={currentUserId}
          pixelId={owner.facebook_pixel_id}
          otherUser={{
            id: owner.id,
            name: owner.name,
            avatar_url: owner.avatar_url,
            online_status: owner.online_status,
            last_seen: owner.last_seen,
          }}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OwnerProfile
            owner={owner}
            media={landing.media}
            age={age}
            intentionLabel={intentionLabel}
            pixelId={owner.facebook_pixel_id}
            onOpenPhoto={setLightboxUrl}
          />
          {!isOwner && conversationId ? (
            <div className="px-4 pb-6">
              <Button fullWidth onClick={() => setTab("chat")}>
                Continue chat
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close photo"
            onClick={() => setLightboxUrl(null)}
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            className="relative z-[1] max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 py-3 text-[13px] font-medium",
        active
          ? "border-b-2 border-primary text-primary"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function OwnerProfile({
  owner,
  media,
  age,
  intentionLabel,
  pixelId,
  onOpenPhoto,
}: {
  owner: PrivateLinkLanding["owner"];
  media: PrivateLinkLanding["media"];
  age: number | null;
  intentionLabel?: string;
  pixelId?: string | null;
  onOpenPhoto: (url: string) => void;
}) {
  return (
    <div className="px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <Avatar
          name={owner.name}
          src={owner.avatar_url}
          size="xl"
          online={owner.show_online_status && owner.online_status}
        />
        <h2 className="mt-3 text-[22px] font-semibold text-text-primary">
          {owner.name}
          {age ? `, ${age}` : ""}
        </h2>
        {owner.location ? (
          <p className="mt-1 flex items-center gap-1 text-[14px] text-text-secondary">
            <MapPin className="size-3.5" strokeWidth={1.75} />
            {owner.location}
          </p>
        ) : null}
      </div>

      {owner.bio ? (
        <p className="mt-5 text-[15px] leading-relaxed text-text-secondary">
          {owner.bio}
        </p>
      ) : null}

      {intentionLabel ? (
        <div className="mt-4 rounded-[var(--radius-xl)] bg-background-secondary px-3 py-3 text-[13px] text-text-secondary">
          Looking for:{" "}
          <span className="font-medium text-text-primary">{intentionLabel}</span>
        </div>
      ) : null}

      {owner.interests?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {owner.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-background-secondary px-2.5 py-1 text-[12px] text-text-secondary"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : null}

      {media.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-3 text-[15px] font-semibold text-text-primary">
            Photos
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <button
                key={item.id}
                type="button"
                className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-background-secondary"
                onClick={() => {
                  onOpenPhoto(item.url);
                  void trackFacebookEvent(
                    "ViewContent",
                    { content_type: "profile_photo" },
                    pixelId,
                  );
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
