"use client";

import { Button, useToast } from "@/components/ui";
import { updateProfile } from "@/lib/profile/actions";
import type { UserProfile } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-[13px] text-text-secondary">{description}</p>
      </div>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-background-chat",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-background transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

export function PrivacyForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showOnline, setShowOnline] = useState(profile.show_online_status);
  const [showLastSeen, setShowLastSeen] = useState(profile.show_last_seen);
  const [allowRequests, setAllowRequests] = useState(
    profile.allow_friend_requests,
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    try {
      await updateProfile(supabase, profile.id, {
        show_online_status: showOnline,
        show_last_seen: showLastSeen,
        allow_friend_requests: allowRequests,
      });
      toast({ title: "Privacy updated", tone: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-4">
      <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-border">
        <ToggleRow
          label="Show online status"
          description="Let others see when you're active"
          checked={showOnline}
          onChange={setShowOnline}
        />
        <div className="border-t border-border">
          <ToggleRow
            label="Show last seen"
            description="Allow others to see when you were last online"
            checked={showLastSeen}
            onChange={setShowLastSeen}
          />
        </div>
        <div className="border-t border-border">
          <ToggleRow
            label="Allow friend requests"
            description="People can send you friend requests from Discover"
            checked={allowRequests}
            onChange={setAllowRequests}
          />
        </div>
      </section>

      <div className="mt-auto pt-6 pb-4">
        <Button fullWidth size="lg" loading={saving} onClick={save}>
          Save privacy settings
        </Button>
      </div>
    </div>
  );
}
