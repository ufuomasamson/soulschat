"use client";

import { Avatar, Button, useToast } from "@/components/ui";
import {
  createOrGetPrivateChatLink,
  listMyLinkGuests,
  regeneratePrivateChatLink,
  saveFacebookPixel,
  setLinkGuestFeedVisibility,
} from "@/lib/advert/actions";
import {
  connectAndVerifyFacebookPixel,
  extractFacebookPixelId,
} from "@/lib/advert/pixel";
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
  Unplug,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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
  const [pixelInput, setPixelInput] = useState(initialPixelId ?? "");
  const [connectedPixelId, setConnectedPixelId] = useState(initialPixelId);
  const [savingPixel, setSavingPixel] = useState(false);
  const [link, setLink] = useState<PrivateChatLink | null>(initialLink);
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAds, setCopiedAds] = useState(false);
  const [guests, setGuests] = useState(initialGuests);
  const [busyGuestId, setBusyGuestId] = useState<string | null>(null);

  const publicUrl = link ? privateChatLinkUrl(link.slug) : null;
  const parsedPixelId = useMemo(
    () => extractFacebookPixelId(pixelInput),
    [pixelInput],
  );
  const isConnected = Boolean(connectedPixelId);

  async function handleConnectPixel(e: FormEvent) {
    e.preventDefault();
    setSavingPixel(true);
    const supabase = createClient();

    try {
      const extracted = extractFacebookPixelId(pixelInput);
      if (!extracted) {
        throw new Error(
          "Paste your Meta Pixel ID or the full Meta Pixel Code from Events Manager.",
        );
      }

      const saved = await saveFacebookPixel(supabase, pixelInput);
      if (!saved) {
        throw new Error("Couldn't connect pixel.");
      }

      const verified = await connectAndVerifyFacebookPixel(saved);
      setConnectedPixelId(saved);
      setPixelInput(saved);

      if (!verified.ok) {
        toast({
          title: "Pixel saved",
          description:
            "Connected in SoulsChat, but Facebook verification needs a refresh. Open your private chat link, then check Events Manager.",
          tone: "success",
        });
      } else {
        toast({
          title: "Facebook Pixel connected",
          description:
            "PageView was sent so Meta can verify this pixel. Use your private chat link as the ads destination URL.",
          tone: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Couldn't connect pixel",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setSavingPixel(false);
    }
  }

  async function handleDisconnectPixel() {
    setSavingPixel(true);
    const supabase = createClient();
    try {
      await saveFacebookPixel(supabase, "");
      setConnectedPixelId(null);
      setPixelInput("");
      toast({ title: "Pixel disconnected", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't disconnect pixel",
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

  async function handleCopy(url: string, ads = false) {
    try {
      await navigator.clipboard.writeText(url);
      if (ads) {
        setCopiedAds(true);
        window.setTimeout(() => setCopiedAds(false), 1600);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
      toast({
        title: ads ? "Ads destination copied" : "Link copied",
        tone: "success",
      });
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
              Connect your Meta Pixel, then use your private chat link as the
              Facebook ads destination. Guests enter name and email, chat with
              you, and stay off Feed until you show them.
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
            Paste your Pixel ID or the full Meta Pixel Code from Events Manager,
            then click Connect. SoulsChat installs it on your private chat link
            and sends a PageView so Facebook can verify it.
          </p>
        </div>

        {isConnected ? (
          <div className="space-y-3 rounded-[var(--radius-2xl)] border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-text-primary">
                  Pixel connected
                </p>
                <p className="mt-0.5 break-all font-mono text-[13px] text-text-secondary">
                  {connectedPixelId}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-text-muted">
                  Check Meta Events Manager → Test events / Overview after
                  opening your private chat link. You should see PageView, Lead,
                  and Contact from guest activity.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (publicUrl) window.open(publicUrl, "_blank", "noopener");
                  else
                    toast({
                      title: "Create your private chat link first",
                      tone: "error",
                    });
                }}
              >
                <ExternalLink className="size-4" strokeWidth={1.75} />
                Test link
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={savingPixel}
                onClick={() => void handleDisconnectPixel()}
              >
                <Unplug className="size-4" strokeWidth={1.75} />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectPixel} className="space-y-3">
            <label className="flex w-full flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text-primary">
                Pixel ID or Meta Pixel Code
              </span>
              <textarea
                name="facebook_pixel_code"
                rows={6}
                spellCheck={false}
                placeholder={`Paste Pixel ID (e.g. 2201611330568131) or the full Meta Pixel Code:

<!-- Meta Pixel Code -->
<script>
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>`}
                value={pixelInput}
                onChange={(e) => setPixelInput(e.target.value)}
                className={cn(
                  "w-full resize-y rounded-[var(--radius-xl)] border border-border bg-background px-3.5 py-3",
                  "font-mono text-[12px] leading-relaxed text-text-primary placeholder:font-sans placeholder:text-text-muted",
                  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
                )}
              />
              <span className="text-[12px] text-text-muted">
                {parsedPixelId
                  ? `Detected Pixel ID: ${parsedPixelId}`
                  : "Copy the code from Meta Events Manager → Data sources → Pixel → Set up."}
              </span>
            </label>
            <Button
              type="submit"
              loading={savingPixel}
              fullWidth
              disabled={!pixelInput.trim()}
            >
              Connect
            </Button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">
            Private chat link
          </h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            Use this HTTPS URL as your Facebook / Meta ads destination. The page
            includes Open Graph tags and your connected Pixel so Meta can scrape
            and track it.
          </p>
        </div>

        {link && publicUrl ? (
          <div className="space-y-3 rounded-[var(--radius-2xl)] border border-border p-4">
            <div className="flex items-center gap-2 text-[13px] text-text-secondary">
              <Link2 className="size-4 text-primary" strokeWidth={1.75} />
              <span>
                {link.visit_count} visit{link.visit_count === 1 ? "" : "s"}
              </span>
              {isConnected ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                  Pixel active
                </span>
              ) : (
                <span className="rounded-full bg-background-secondary px-2 py-0.5 text-[11px] font-medium text-text-muted">
                  Connect pixel for tracking
                </span>
              )}
            </div>

            <div
              className={cn(
                "break-all rounded-[var(--radius-xl)] bg-background-secondary px-3 py-3",
                "text-[13px] font-medium text-text-primary",
              )}
            >
              {publicUrl}
            </div>

            <div className="rounded-[var(--radius-xl)] border border-dashed border-border px-3 py-3 text-[12px] leading-relaxed text-text-secondary">
              In Ads Manager, create a traffic or engagement campaign and set{" "}
              <span className="font-medium text-text-primary">
                Website URL / Destination
              </span>{" "}
              to this link. Meta will read the page preview and your Pixel will
              fire PageView when someone lands.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCopy(publicUrl)}
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
                onClick={() => void handleCopy(publicUrl, true)}
              >
                {copiedAds ? (
                  <Check className="size-4" strokeWidth={1.75} />
                ) : (
                  <Megaphone className="size-4" strokeWidth={1.75} />
                )}
                {copiedAds ? "Copied" : "Copy for ads"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(publicUrl, "_blank", "noopener")}
              >
                <ExternalLink className="size-4" strokeWidth={1.75} />
                Open
              </Button>
              <Button
                type="button"
                variant="outline"
                loading={linkBusy}
                onClick={() => void handleRegenerate()}
              >
                <RefreshCw className="size-4" strokeWidth={1.75} />
                Regenerate
              </Button>
            </div>
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
                <Avatar name={guest.name} src={guest.avatar_url} size="sm" />
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
