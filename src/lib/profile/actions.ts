import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileMediaItem, UserProfile } from "./types";
import { MAX_PROFILE_MEDIA } from "./types";

type AnyClient = SupabaseClient;

export async function updateProfile(
  supabase: AnyClient,
  userId: string,
  patch: Partial<
    Pick<
      UserProfile,
      | "name"
      | "bio"
      | "location"
      | "gender"
      | "interests"
      | "relationship_intention"
      | "avatar_url"
      | "date_of_birth"
      | "show_online_status"
      | "show_last_seen"
      | "allow_friend_requests"
    >
  >,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(
  supabase: AnyClient,
  userId: string,
  file: File,
) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // cache-bust so next/image / browser refresh the new photo
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function uploadProfileMedia(
  supabase: AnyClient,
  userId: string,
  file: File,
  currentCount: number,
): Promise<ProfileMediaItem> {
  if (currentCount >= MAX_PROFILE_MEDIA) {
    throw new Error(`You can upload up to ${MAX_PROFILE_MEDIA} photos.`);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-media")
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage
    .from("profile-media")
    .getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("profile_media")
    .insert({
      user_id: userId,
      url: `${publicData.publicUrl}?v=${Date.now()}`,
      storage_path: storagePath,
      sort_order: currentCount,
    })
    .select("id, user_id, url, storage_path, sort_order, created_at")
    .single();

  if (error) {
    await supabase.storage.from("profile-media").remove([storagePath]);
    throw error;
  }

  return data as ProfileMediaItem;
}

export async function deleteProfileMedia(
  supabase: AnyClient,
  userId: string,
  item: ProfileMediaItem,
) {
  const { error } = await supabase
    .from("profile_media")
    .delete()
    .eq("id", item.id)
    .eq("user_id", userId);

  if (error) throw error;

  await supabase.storage.from("profile-media").remove([item.storage_path]);
}

export async function blockUser(supabase: AnyClient, targetUserId: string) {
  const { error } = await supabase.rpc("block_user", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function unblockUser(supabase: AnyClient, targetUserId: string) {
  const { error } = await supabase.rpc("unblock_user", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
}

export async function reportUser(
  supabase: AnyClient,
  input: {
    reportedId: string;
    reason: "spam" | "harassment" | "fake_profile" | "inappropriate" | "other";
    details?: string;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id: input.reportedId,
    reason: input.reason,
    details: input.details ?? "",
  });

  if (error) throw error;
}
