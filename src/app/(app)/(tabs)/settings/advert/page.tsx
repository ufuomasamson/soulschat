import { AdvertSettingsForm } from "@/components/advert/AdvertSettingsForm";
import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import { fetchActivePrivateChatLink } from "@/lib/advert/queries";
import { fetchProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Advert",
};

export const instant = false;

export default async function AdvertSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const [profile, link] = await Promise.all([
    fetchProfile(supabase, userId),
    fetchActivePrivateChatLink(supabase, userId),
  ]);

  if (!profile) redirect("/settings");
  if (profile.is_guest) redirect("/settings");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Advert" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AdvertSettingsForm
          initialPixelId={profile.facebook_pixel_id}
          initialLink={link}
        />
      </div>
    </div>
  );
}
