import { PrivacyForm } from "@/components/settings/PrivacyForm";
import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import { fetchProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy",
};

export const instant = false;

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const profile = await fetchProfile(supabase, userId);
  if (!profile) redirect("/settings");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Privacy" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PrivacyForm profile={profile} />
      </div>
    </div>
  );
}
