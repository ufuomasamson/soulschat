import type { ProfileSummary } from "@/lib/chat/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FriendListItem,
  FriendRequestItem,
  FriendshipRelation,
  FriendRow,
} from "./types";

type AnyClient = SupabaseClient;

function mapProfile(row: Record<string, unknown> | null): ProfileSummary | null {
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name ?? "Unknown"),
    avatar_url: (row.avatar_url as string | null) ?? null,
    online_status: Boolean(row.online_status),
    last_seen: (row.last_seen as string | null) ?? null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as Record<string, unknown> | undefined) ?? null;
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

export async function fetchFriends(
  supabase: AnyClient,
  userId: string,
): Promise<FriendListItem[]> {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!friends_sender_id_fkey (
        id, name, avatar_url, online_status, last_seen
      ),
      receiver:profiles!friends_receiver_id_fkey (
        id, name, avatar_url, online_status, last_seen
      )
    `,
    )
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items: FriendListItem[] = [];
  for (const row of data ?? []) {
    const other =
      row.sender_id === userId
        ? mapProfile(asRecord(row.receiver))
        : mapProfile(asRecord(row.sender));
    if (!other) continue;
    items.push({
      friendshipId: String(row.id),
      profile: other,
      since: String(row.created_at),
    });
  }

  return items.sort((a, b) => {
    if (a.profile.online_status !== b.profile.online_status) {
      return a.profile.online_status ? -1 : 1;
    }
    return a.profile.name.localeCompare(b.profile.name);
  });
}

export async function fetchFriendRequests(
  supabase: AnyClient,
  userId: string,
): Promise<FriendRequestItem[]> {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      sender:profiles!friends_sender_id_fkey (
        id, name, avatar_url, online_status, last_seen
      ),
      receiver:profiles!friends_receiver_id_fkey (
        id, name, avatar_url, online_status, last_seen
      )
    `,
    )
    .eq("status", "pending")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const items: FriendRequestItem[] = [];
  for (const row of data ?? []) {
    const incoming = row.receiver_id === userId;
    const profile = incoming
      ? mapProfile(asRecord(row.sender))
      : mapProfile(asRecord(row.receiver));
    if (!profile) continue;
    items.push({
      friendshipId: String(row.id),
      profile,
      created_at: String(row.created_at),
      direction: incoming ? "incoming" : "outgoing",
    });
  }

  return items;
}

export async function getFriendshipRelation(
  supabase: AnyClient,
  userId: string,
  otherUserId: string,
): Promise<{ relation: FriendshipRelation; friendship?: FriendRow }> {
  const { data, error } = await supabase
    .from("friends")
    .select("id, sender_id, receiver_id, status, created_at")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`,
    )
    .maybeSingle();

  if (error) throw error;
  if (!data) return { relation: "none" };

  const friendship = data as FriendRow;
  if (friendship.status === "accepted") {
    return { relation: "friends", friendship };
  }
  if (friendship.status === "blocked") {
    return { relation: "blocked", friendship };
  }
  if (friendship.status === "declined") {
    return { relation: "declined", friendship };
  }
  if (friendship.status === "pending") {
    if (friendship.sender_id === userId) {
      return { relation: "outgoing_request", friendship };
    }
    return { relation: "incoming_request", friendship };
  }

  return { relation: "none", friendship };
}

export async function fetchDiscoverPeople(
  supabase: AnyClient,
  userId: string,
): Promise<
  Array<
    ProfileSummary & {
      bio: string;
      location: string;
      interests: string[];
      relation: FriendshipRelation;
      friendshipId?: string;
    }
  >
> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, name, avatar_url, online_status, last_seen, bio, location, interests",
    )
    .neq("id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const { data: friendships } = await supabase
    .from("friends")
    .select("id, sender_id, receiver_id, status")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  const relationByUser = new Map<
    string,
    { relation: FriendshipRelation; friendshipId?: string }
  >();

  for (const row of friendships ?? []) {
    const otherId =
      row.sender_id === userId ? row.receiver_id : row.sender_id;
    let relation: FriendshipRelation = "none";
    if (row.status === "accepted") relation = "friends";
    else if (row.status === "blocked") relation = "blocked";
    else if (row.status === "declined") relation = "declined";
    else if (row.status === "pending") {
      relation =
        row.sender_id === userId ? "outgoing_request" : "incoming_request";
    }
    relationByUser.set(String(otherId), {
      relation,
      friendshipId: String(row.id),
    });
  }

  return (profiles ?? [])
    .map((row) => {
      const profile = mapProfile(row as Record<string, unknown>);
      if (!profile) return null;
      const rel = relationByUser.get(profile.id) ?? { relation: "none" as const };
      return {
        ...profile,
        bio: String(row.bio ?? ""),
        location: String(row.location ?? ""),
        interests: (row.interests as string[] | null) ?? [],
        relation: rel.relation,
        friendshipId: rel.friendshipId,
      };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p) => p.relation !== "blocked");
}
