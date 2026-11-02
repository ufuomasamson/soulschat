"use client";

import { Avatar, Button, Input, useToast } from "@/components/ui";
import {
  createOrGetPrivateChatLink,
  listMyLinkGuests,
  regeneratePrivateChatLink,
  saveFacebookPixel,
  setLinkGuestFeedVisibility,
} from "@/lib/advert/actions";
import {
  privateChatLinkUrl,
  type LinkGuestSummary,
  type PrivateChatLink,
} from "@/lib/advert/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function AdvertSettingsForm({
  initialPixelId,
  initialLink,
  initialGuests,
}: {
  initialPixelId: string | null;
  initialLink: PrivateChatLink | null;
  initialGuests: LinkGuestSummary[];
}) {
  const { toast } = useToast();
  const [pixelId, setPixelId] = useState(initialPixelId ?? "");
  const [savingPixel, setSavingPixel] = useState(false);
  const [link, setLink] = useState<PrivateChatLink | null>(initialLink);
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guests, setGuests] = useState(initialGuests);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);

  const publicUrl = link ? privateChatLinkUrl(link.slug) : null;

  async function handleSavePixel(e: FormEvent) {
    e.preventDefault();
    setSavingPixel(true);
    const supabase = createClient();
    try {
      const saved = await saveFacebookPixel(supabase, pixelId);
      setPixelId(saved ?? "");
      toast({
        title: saved ? "Facebook Pixel connected" : "Pixel removed",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't save pixel",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setSavingPixel(false);
    }
  }

  async function handleCreateLink() {
    setLinkBusy(true);
    const supabase = createClient();
    try {
      const created = await createOrGetPrivateChatLink(supabase);
      setLink(created);
      toast({ title: "Private chat link ready", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't create link",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleRegenerate() {
    if (
      !window.confirm(
        "Regenerate your link? The old link will stop working for new visitors.",
      )
    ) {
      return;
    }
    setLinkBusy(true);
    const supabase = createClient();
    try {
      const created = await regeneratePrivateChatLink(supabase);
      setLink(created);
      toast({ title: "New link created", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't regenerate link",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setLinkBusy(false);
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: "Link copied", tone: "success" });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Couldn't copy link", tone: "error" });
    }
  }

  async function refreshGuests() {
    const supabase = createClient();
    const rows = await listMyLinkGuests(supabase);
    setGuests(rows);
  }

  async function handleToggleGuestFeed(guest: LinkGuestSummary) {
    setBusyGuestId(guest.id);
    const supabase = createClient();
    try {
      const result = await setLinkGuestFeedVisibility(
        supabase,
        guest.id,
        !guest.show_on_feed,
      );
      setGuests((prev) =>
        prev.map((row) =>
          row.id === guest.id
            ? { ...row, show_on_feed: result.show_on_feed }
            : row,
        ),
      );
      toast({
        title: result.show_on_feed ? "Visible on Feed" : "Hidden from Feed",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update Feed visibility",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyGuestId(null);
    }
  }

  return (
    <div className="space-y-6 px-4 py-5">
      <section className="rounded-[var(--radius-2xl)] border border-border p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            <Megaphone className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Run ads with your profile
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
              Connect your Facebook Pixel and share your private chat link in
              ads. Visitors enter their name and email, become guests, and can
              chat with you while Facebook tracks the journey. Guests stay
              hidden from Feed until you show them.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            Facebook Pixel
          </h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            Paste your Pixel ID from Events Manager. It loads on your private
            chat link and tracks PageView, Lead, and Contact events.
          </p>
        </div>

        <form onSubmit={handleSavePixel} className="space-y-3">
          <Input
            label="Pixel ID"
            name="facebook_pixel_id"
            inputMode="numeric"
            placeholder="e.g. 123456789012345"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ""))}
            hint="Numbers only. Leave blank and save to disconnect."
          />
          <Button type="submit" loading={savingPixel} fullWidth>
            Save Pixel
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            Private chat link
          </h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            This is the URL you use in Facebook ads. Guests see your profile and
            photos, then chat with you privately.
          </p>
        </div>

        {link && publicUrl ? (
          <div className="space-y-3 rounded-[var(--radius-2xl)] border border-border p-4">
            <div className="flex items-center gap-2 text-[13px] text-text-secondary">
              <Link2 className="size-4 text-primary" strokeWidth={1.75} />
              <span>
                {link.visit_count} visit{link.visit_count === 1 ? "" : "s"}
              </span>
            </div>

            <div
              className={cn(
                "break-all rounded-[var(--radius-xl)] bg-background-secondary px-3 py-3",
                "text-[13px] font-medium text-text-primary",
              )}
            >
              {publicUrl}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <Check className="size-4" strokeWidth={1.75} />
                ) : (
                  <Copy className="size-4" strokeWidth={1.75} />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(publicUrl, "_blank", "noopener")}
              >
                <ExternalLink className="size-4" strokeWidth={1.75} />
                Open
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              loading={linkBusy}
              onClick={() => void handleRegenerate()}
            >
              <RefreshCw className="size-4" strokeWidth={1.75} />
              Regenerate link
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            fullWidth
            loading={linkBusy}
            onClick={() => void handleCreateLink()}
          >
            <Link2 className="size-4" strokeWidth={1.75} />
            Create private chat link
          </Button>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary">
              Link guests
            </h3>
            <p className="mt-1 text-[13px] text-text-secondary">
              People who joined through your private chat link. They stay off
              Feed until you show them.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void refreshGuests().catch(() =>
                toast({ title: "Couldn't refresh guests", tone: "error" }),
              )
            }
            className="text-[12px] font-medium text-primary"
          >
            Refresh
          </button>
        </div>

        {guests.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] border border-dashed border-border px-4 py-6 text-center text-[13px] text-text-secondary">
            No guests yet. Share your private chat link to start conversations.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-2xl)] border border-border">
            {guests.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center gap-3 px-3 py-3"
              >
                <Avatar
                  name={guest.name}
                  src={guest.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-text-primary">
                    {guest.name}
                  </p>
                  <p className="truncate text-[12px] text-text-secondary">
                    {guest.email || "No email"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/chats/${guest.conversation_id}`}
                    className="text-[12px] font-medium text-primary"
                  >
                    Chat
                  </Link>
                  <button
                    type="button"
                    disabled={busyGuestId === guest.id}
                    onClick={() => void handleToggleGuestFeed(guest)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      guest.show_on_feed
                        ? "bg-primary text-text-inverse"
                        : "bg-background-secondary text-text-primary",
                      busyGuestId === guest.id && "opacity-60",
                    )}
                  >
                    {guest.show_on_feed ? (
                      <Eye className="size-3" strokeWidth={1.75} />
                    ) : (
                      <EyeOff className="size-3" strokeWidth={1.75} />
                    )}
                    {guest.show_on_feed ? "On Feed" : "Show"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
