import { ProfileView } from "@/components/profile/ProfileView";
import { getFriendshipRelation } from "@/lib/friends/queries";
import { fetchProfile, fetchProfileMedia } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await fetchProfile(supabase, id);
  return {
    title: profile?.name ?? "Profile",
  };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const currentUserId = data?.claims?.sub;
  if (!currentUserId) redirect("/login");

  const [profile, media] = await Promise.all([
    fetchProfile(supabase, id),
    fetchProfileMedia(supabase, id),
  ]);
  if (!profile) notFound();

  const { relation, friendship } = await getFriendshipRelation(
    supabase,
    currentUserId,
    id,
  );

  return (
    <ProfileView
      profile={profile}
      media={media}
      currentUserId={currentUserId}
      initialRelation={relation}
      friendshipId={friendship?.id}
    />
  );
}
