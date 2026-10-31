"use client";

import { Button, Input, useToast } from "@/components/ui";
import {
  createOrGetPrivateChatLink,
  regeneratePrivateChatLink,
  saveFacebookPixel,
} from "@/lib/advert/actions";
import {
  privateChatLinkUrl,
  type PrivateChatLink,
} from "@/lib/advert/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { FormEvent, useState } from "react";

export function AdvertSettingsForm({
  initialPixelId,
  initialLink,
}: {
  initialPixelId: string | null;
  initialLink: PrivateChatLink | null;
}) {
  const { toast } = useToast();
  const [pixelId, setPixelId] = useState(initialPixelId ?? "");
  const [savingPixel, setSavingPixel] = useState(false);
  const [link, setLink] = useState<PrivateChatLink | null>(initialLink);
  const [linkBusy, setLinkBusy] = useState(false);
  const [copied, setCopied] = useState(false);

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
              ads. Visitors enter their name, become guests, and can chat with
              you while Facebook tracks the journey.
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
    </div>
  );
}
