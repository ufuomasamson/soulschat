"use client";

import { Avatar, Button, TopBar, useToast } from "@/components/ui";
import { getAgeFromDob, RELATIONSHIP_OPTIONS } from "@/lib/auth/constants";
import { startDirectConversation } from "@/lib/chat/actions";
import { formatLastSeen } from "@/lib/chat/time";
import {
  respondFriendRequest,
  sendFriendRequest,
} from "@/lib/friends/actions";
import type { FriendshipRelation } from "@/lib/friends/types";
import { blockUser, reportUser } from "@/lib/profile/actions";
import type { ProfileMediaItem, UserProfile } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Flag, MapPin, MoreHorizontal, ShieldBan, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function ProfileView({
  profile,
  media,
  currentUserId,
  initialRelation,
  friendshipId,
}: {
  profile: UserProfile;
  media: ProfileMediaItem[];
  currentUserId: string;
  initialRelation: FriendshipRelation;
  friendshipId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [relation, setRelation] = useState(initialRelation);
  const [requestId, setRequestId] = useState(friendshipId);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const isSelf = currentUserId === profile.id;

  const age = getAgeFromDob(profile.date_of_birth);
  const intentionLabel = RELATIONSHIP_OPTIONS.find(
    (o) => o.value === profile.relationship_intention,
  )?.label;

  const statusText = useMemo(() => {
    if (!profile.show_online_status && !profile.show_last_seen) {
      return null;
    }
    if (profile.show_online_status && profile.online_status) return "online";
    if (profile.show_last_seen) {
      return formatLastSeen(
        profile.last_seen,
        profile.show_online_status && profile.online_status,
      );
    }
    return null;
  }, [profile]);

  async function handleAddFriend() {
    setBusy(true);
    const supabase = createClient();
    try {
      const row = await sendFriendRequest(supabase, profile.id);
      setRelation("outgoing_request");
      setRequestId(row.id);
      toast({ title: "Friend request sent", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't send request",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    if (!requestId) return;
    setBusy(true);
    const supabase = createClient();
    try {
      await respondFriendRequest(supabase, requestId, true);
      setRelation("friends");
      toast({ title: "You're now friends", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't accept",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleMessage() {
    setBusy(true);
    const supabase = createClient();
    try {
      const conversationId = await startDirectConversation(
        supabase,
        profile.id,
      );
      router.push(`/chats/${conversationId}`);
    } catch (err) {
      toast({
        title: "Couldn't open chat",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock() {
    setBusy(true);
    setMenuOpen(false);
    const supabase = createClient();
    try {
      await blockUser(supabase, profile.id);
      setRelation("blocked");
      toast({ title: "User blocked", tone: "success" });
      router.push("/friends");
    } catch (err) {
      toast({
        title: "Couldn't block",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleReport() {
    setMenuOpen(false);
    const supabase = createClient();
    try {
      await reportUser(supabase, {
        reportedId: profile.id,
        reason: "other",
        details: "Reported from profile",
      });
      toast({ title: "Report submitted", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't report",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    }
  }

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Profile"
        bordered
        className="bg-background pr-2 pl-1"
        left={
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.back()}
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-text-primary hover:bg-background-secondary"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </button>
        }
        right={
          !isSelf ? (
            <div className="relative">
              <button
                type="button"
                aria-label="More options"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-text-primary hover:bg-background-secondary"
              >
                <MoreHorizontal className="size-5" strokeWidth={1.75} />
              </button>
              {menuOpen ? (
                <>
                  <div className="absolute top-11 right-0 z-20 w-44 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background shadow-[var(--shadow-subtle)]">
                    <button
                      type="button"
                      onClick={handleReport}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-text-primary hover:bg-background-secondary"
                    >
                      <Flag className="size-4" strokeWidth={1.75} />
                      Report
                    </button>
                    <button
                      type="button"
                      onClick={handleBlock}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-error hover:bg-background-secondary"
                    >
                      <ShieldBan className="size-4" strokeWidth={1.75} />
                      Block
                    </button>
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-10"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              ) : null}
            </div>
          ) : (
            <Link
              href="/settings/edit-profile"
              className="pr-2 text-[14px] font-medium text-primary"
            >
              Edit
            </Link>
          )
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col items-center text-center">
          <Avatar
            name={profile.name}
            src={profile.avatar_url}
            online={
              profile.show_online_status ? profile.online_status : false
            }
            size="xl"
          />
          <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-text-primary">
            {profile.name}
            {age ? (
              <span className="font-medium text-text-secondary">, {age}</span>
            ) : null}
          </h1>
          {profile.location ? (
            <p className="mt-1 flex items-center gap-1 text-[14px] text-text-secondary">
              <MapPin className="size-3.5" strokeWidth={1.75} />
              {profile.location}
            </p>
          ) : null}
          {statusText ? (
            <p className="mt-1 text-[13px] text-text-muted">{statusText}</p>
          ) : null}
        </div>

        {profile.bio ? (
          <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
            {profile.bio}
          </p>
        ) : null}

        {intentionLabel ? (
          <div className="mt-5 rounded-[var(--radius-xl)] bg-background-secondary px-4 py-3">
            <p className="text-[12px] font-medium tracking-wide text-text-muted uppercase">
              Looking for
            </p>
            <p className="mt-1 text-[15px] text-text-primary">{intentionLabel}</p>
          </div>
        ) : null}

        {profile.interests.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-text-primary">
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-background-secondary px-3 py-1.5 text-[13px] text-text-secondary"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {media.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-text-primary">
              Photos
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxUrl(item.url)}
                  className="aspect-[3/4] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-background-secondary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`${profile.name} photo`}
                    className="size-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className={cn("mt-8 flex flex-col gap-2 pb-6")}>
          {isSelf ? (
            <Button
              fullWidth
              size="lg"
              onClick={() => router.push("/settings/edit-profile")}
            >
              Edit Profile
            </Button>
          ) : relation === "friends" ? (
            <Button fullWidth size="lg" loading={busy} onClick={handleMessage}>
              Message
            </Button>
          ) : relation === "outgoing_request" ? (
            <Button fullWidth size="lg" variant="secondary" disabled>
              Request sent
            </Button>
          ) : relation === "incoming_request" ? (
            <Button fullWidth size="lg" loading={busy} onClick={handleAccept}>
              Accept request
            </Button>
          ) : relation === "blocked" ? (
            <Button fullWidth size="lg" variant="outline" disabled>
              Blocked
            </Button>
          ) : profile.allow_friend_requests ? (
            <Button fullWidth size="lg" loading={busy} onClick={handleAddFriend}>
              Add Friend
            </Button>
          ) : (
            <Button fullWidth size="lg" variant="outline" disabled>
              Not accepting requests
            </Button>
          )}
        </div>
      </div>

      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            aria-label="Close photo"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/15 text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt={`${profile.name} photo`}
            className="max-h-full max-w-full rounded-[var(--radius-xl)] object-contain"
            onClick={() => setLightboxUrl(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
