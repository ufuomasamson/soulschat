import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import { EditProfileForm } from "@/components/settings/EditProfileForm";
import { fetchProfile, fetchProfileMedia } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export const instant = false;

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const [profile, media] = await Promise.all([
    fetchProfile(supabase, userId),
    fetchProfileMedia(supabase, userId),
  ]);
  if (!profile) redirect("/settings");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Edit Profile" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditProfileForm profile={profile} initialMedia={media} />
      </div>
    </div>
  );
}
