import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileMediaItem, UserProfile } from "./types";

type AnyClient = SupabaseClient;

const PROFILE_SELECT = `
  id,
  name,
  email,
  avatar_url,
  bio,
  location,
  date_of_birth,
  gender,
  interests,
  relationship_intention,
  online_status,
  last_seen,
  show_online_status,
  show_last_seen,
  allow_friend_requests,
  is_guest,
  is_admin,
  is_disabled,
  show_on_feed,
  facebook_pixel_id
`;

export async function fetchProfile(
  supabase: AnyClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id),
    name: String(data.name ?? ""),
    email: (data.email as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    bio: String(data.bio ?? ""),
    location: String(data.location ?? ""),
    date_of_birth: (data.date_of_birth as string | null) ?? null,
    gender: (data.gender as string | null) ?? null,
    interests: (data.interests as string[] | null) ?? [],
    relationship_intention:
      (data.relationship_intention as string | null) ?? null,
    online_status: Boolean(data.online_status),
    last_seen: (data.last_seen as string | null) ?? null,
    show_online_status: data.show_online_status !== false,
    show_last_seen: data.show_last_seen !== false,
    allow_friend_requests: data.allow_friend_requests !== false,
    is_guest: Boolean(data.is_guest),
    is_admin: Boolean(data.is_admin),
    is_disabled: Boolean(data.is_disabled),
    show_on_feed: data.show_on_feed !== false,
    facebook_pixel_id: (data.facebook_pixel_id as string | null) ?? null,
  };
}

export async function fetchProfileMedia(
  supabase: AnyClient,
  userId: string,
): Promise<ProfileMediaItem[]> {
  const { data, error } = await supabase
    .from("profile_media")
    .select("id, user_id, url, storage_path, sort_order, created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    url: String(row.url),
    storage_path: String(row.storage_path),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
  }));
}

export async function fetchBlockedUsers(supabase: AnyClient, userId: string) {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      receiver_id,
      created_at,
      receiver:profiles!friends_receiver_id_fkey (
        id, name, avatar_url
      )
    `,
    )
    .eq("sender_id", userId)
    .eq("status", "blocked")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const receiver = Array.isArray(row.receiver)
      ? row.receiver[0]
      : row.receiver;
    return {
      friendshipId: String(row.id),
      userId: String(row.receiver_id),
      name: String(receiver?.name ?? "Unknown"),
      avatar_url: (receiver?.avatar_url as string | null) ?? null,
      blocked_at: String(row.created_at),
    };
  });
}
