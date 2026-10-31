import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, ConversationPreview, ProfileSummary } from "./types";

type AnyClient = SupabaseClient;

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

export async function fetchConversationPreviews(
  supabase: AnyClient,
  userId: string,
): Promise<ConversationPreview[]> {
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select(
      `
      conversation_id,
      last_read_at,
      conversations (
        id,
        updated_at,
        last_message_at,
        last_message_preview
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  if (!memberships?.length) return [];

  const conversationIds = memberships.map((m) => m.conversation_id as string);

  const { data: memberRows, error: membersError } = await supabase
    .from("conversation_members")
    .select(
      `
      conversation_id,
      user_id,
      profiles (
        id,
        name,
        avatar_url,
        online_status,
        last_seen
      )
    `,
    )
    .in("conversation_id", conversationIds);

  if (membersError) throw membersError;

  const { data: unreadRows } = await supabase
    .from("messages")
    .select("conversation_id, created_at, sender_id, read_at, deleted_at")
    .in("conversation_id", conversationIds)
    .is("deleted_at", null)
    .neq("sender_id", userId);

  const lastReadMap = new Map(
    memberships.map((m) => [
      m.conversation_id as string,
      (m.last_read_at as string | null) ?? null,
    ]),
  );

  const unreadMap = new Map<string, number>();
  for (const row of unreadRows ?? []) {
    const conversationId = row.conversation_id as string;
    const lastRead = lastReadMap.get(conversationId);
    const createdAt = row.created_at as string;
    const alreadyRead = Boolean(row.read_at);
    if (alreadyRead) continue;
    if (lastRead && new Date(createdAt) <= new Date(lastRead)) continue;
    unreadMap.set(conversationId, (unreadMap.get(conversationId) ?? 0) + 1);
  }

  const otherByConversation = new Map<string, ProfileSummary>();
  for (const row of memberRows ?? []) {
    if (row.user_id === userId) continue;
    const profile = mapProfile(asRecord(row.profiles));
    if (profile) {
      otherByConversation.set(row.conversation_id as string, profile);
    }
  }

  const previews: ConversationPreview[] = [];

  for (const membership of memberships) {
    const conversation = asRecord(membership.conversations);
    if (!conversation) continue;

    const id = String(conversation.id);
    const other = otherByConversation.get(id);
    if (!other) continue;

    previews.push({
      id,
      updated_at: String(conversation.updated_at),
      last_message_at: (conversation.last_message_at as string | null) ?? null,
      last_message_preview:
        String(conversation.last_message_preview || "No messages yet"),
      unread_count: unreadMap.get(id) ?? 0,
      other_user: other,
    });
  }

  return previews.sort((a, b) => {
    const aTime = a.last_message_at ?? a.updated_at;
    const bTime = b.last_message_at ?? b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function fetchConversationMeta(
  supabase: AnyClient,
  conversationId: string,
  userId: string,
) {
  const { data: membership, error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!membership) return null;

  const { data: others, error: othersError } = await supabase
    .from("conversation_members")
    .select(
      `
      user_id,
      profiles (
        id,
        name,
        avatar_url,
        online_status,
        last_seen
      )
    `,
    )
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (othersError) throw othersError;

  const other = mapProfile(asRecord(others?.profiles));
  if (!other) return null;

  return { id: conversationId, other_user: other };
}

export async function fetchMessages(
  supabase: AnyClient,
  conversationId: string,
  limit = 80,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      message_type,
      media_url,
      media_name,
      media_size,
      media_mime,
      media_duration_ms,
      created_at,
      delivered_at,
      read_at,
      reply_to,
      deleted_at
    `,
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as ChatMessage[];
  const replyIds = rows
    .map((m) => m.reply_to)
    .filter((id): id is string => Boolean(id));

  const replyMap = new Map<
    string,
    {
      id: string;
      content: string;
      sender_id: string;
      message_type: ChatMessage["message_type"];
      media_name: string | null;
      deleted_at: string | null;
    }
  >();

  if (replyIds.length) {
    const { data: replies } = await supabase
      .from("messages")
      .select("id, content, sender_id, message_type, media_name, deleted_at")
      .in("id", replyIds);

    for (const reply of replies ?? []) {
      replyMap.set(String(reply.id), {
        id: String(reply.id),
        content: String(reply.content ?? ""),
        sender_id: String(reply.sender_id),
        message_type: (reply.message_type as ChatMessage["message_type"]) ?? "text",
        media_name: (reply.media_name as string | null) ?? null,
        deleted_at: (reply.deleted_at as string | null) ?? null,
      });
    }
  }

  return rows.map((message) => ({
    ...message,
    reply_preview: message.reply_to
      ? (replyMap.get(message.reply_to) ?? null)
      : null,
  }));
}

export async function listPeopleToMessage(
  supabase: AnyClient,
  userId: string,
): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, online_status, last_seen")
    .neq("id", userId)
    .order("name", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? [])
    .map((row) => mapProfile(row as Record<string, unknown>))
    .filter((p): p is ProfileSummary => Boolean(p));
}
