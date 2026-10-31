import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage, MessageType } from "./types";

type AnyClient = SupabaseClient;

const MESSAGE_SELECT = `
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
`;

export async function startDirectConversation(
  supabase: AnyClient,
  otherUserId: string,
) {
  const { data, error } = await supabase.rpc(
    "get_or_create_direct_conversation",
    { other_user_id: otherUserId },
  );
  if (error) throw error;
  return data as string;
}

export async function markConversationRead(
  supabase: AnyClient,
  conversationId: string,
) {
  const { error } = await supabase.rpc("mark_conversation_read", {
    target_conversation: conversationId,
  });
  if (error) throw error;
}

export async function sendMessage(
  supabase: AnyClient,
  input: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
    mediaUrl?: string | null;
    mediaName?: string | null;
    mediaSize?: number | null;
    mediaMime?: string | null;
    mediaDurationMs?: number | null;
    replyTo?: string | null;
  },
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      content: input.content,
      message_type: input.messageType ?? "text",
      media_url: input.mediaUrl ?? null,
      media_name: input.mediaName ?? null,
      media_size: input.mediaSize ?? null,
      media_mime: input.mediaMime ?? null,
      media_duration_ms: input.mediaDurationMs ?? null,
      reply_to: input.replyTo ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw error;
  return data as ChatMessage;
}

export async function softDeleteMessage(
  supabase: AnyClient,
  messageId: string,
  senderId: string,
) {
  const { error } = await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      content: "",
      media_url: null,
      media_name: null,
      media_size: null,
      media_mime: null,
      media_duration_ms: null,
    })
    .eq("id", messageId)
    .eq("sender_id", senderId);

  if (error) throw error;
}

export async function forwardMessage(
  supabase: AnyClient,
  input: {
    source: ChatMessage;
    targetConversationId: string;
    senderId: string;
  },
): Promise<ChatMessage> {
  if (input.source.deleted_at) {
    throw new Error("Can't forward a deleted message.");
  }

  const type = input.source.message_type;
  if (type !== "image" && type !== "file" && type !== "text" && type !== "voice") {
    throw new Error("This message can't be forwarded.");
  }

  return sendMessage(supabase, {
    conversationId: input.targetConversationId,
    senderId: input.senderId,
    content: input.source.content,
    messageType: type,
    mediaUrl: input.source.media_url,
    mediaName: input.source.media_name,
    mediaSize: input.source.media_size,
    mediaMime: input.source.media_mime,
    mediaDurationMs: input.source.media_duration_ms,
  });
}

export async function markIncomingDelivered(
  supabase: AnyClient,
  messageIds: string[],
) {
  if (!messageIds.length) return;
  const { error } = await supabase
    .from("messages")
    .update({ delivered_at: new Date().toISOString() })
    .in("id", messageIds)
    .is("delivered_at", null);

  if (error) throw error;
}

export type ChatUploadKind = "image" | "file" | "voice";

function normalizeMime(type: string, kind: ChatUploadKind): string {
  const base = (type || "").split(";")[0].trim().toLowerCase();
  if (base) return base;
  if (kind === "image") return "image/jpeg";
  if (kind === "voice") return "audio/webm";
  return "application/octet-stream";
}

export async function uploadChatMedia(
  supabase: AnyClient,
  userId: string,
  file: File,
  kind: ChatUploadKind = "file",
) {
  const mime = normalizeMime(file.type, kind);
  const ext =
    file.name.split(".").pop() ||
    (kind === "voice" ? "webm" : kind === "image" ? "jpg" : "bin");
  const path = `${userId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { upsert: false, contentType: mime });

  if (error) throw error;

  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return {
    url: data.publicUrl,
    name: file.name,
    size: file.size,
    mime,
  };
}

/** @deprecated Use uploadChatMedia */
export async function uploadChatImage(
  supabase: AnyClient,
  userId: string,
  file: File,
) {
  const uploaded = await uploadChatMedia(supabase, userId, file, "image");
  return uploaded.url;
}

export async function setOnlineStatus(
  supabase: AnyClient,
  userId: string,
  online: boolean,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      online_status: online,
      last_seen: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}
