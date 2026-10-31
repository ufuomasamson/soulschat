export type MessageType = "text" | "image" | "file" | "voice" | "system";

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface ProfileSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  online_status: boolean;
  last_seen: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  media_mime: string | null;
  media_duration_ms: number | null;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  reply_to: string | null;
  deleted_at: string | null;
  /** Client-only optimistic flag */
  optimistic?: boolean;
  reply_preview?: {
    id: string;
    content: string;
    sender_id: string;
    message_type: MessageType;
    media_name: string | null;
    deleted_at: string | null;
  } | null;
}

export interface ConversationPreview {
  id: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string;
  unread_count: number;
  other_user: ProfileSummary;
}

export function getMessageStatus(
  message: ChatMessage,
  currentUserId: string,
): MessageStatus | null {
  if (message.sender_id !== currentUserId) return null;
  if (message.optimistic) return "sending";
  if (message.read_at) return "read";
  if (message.delivered_at) return "delivered";
  return "sent";
}

export function getMessagePreviewLabel(message: {
  content?: string | null;
  message_type?: MessageType | null;
  media_name?: string | null;
  deleted_at?: string | null;
}): string {
  if (message.deleted_at) return "Deleted message";
  if (message.message_type === "image") return "Photo";
  if (message.message_type === "voice") return "Voice note";
  if (message.message_type === "file") {
    return message.media_name?.trim() || "File";
  }
  return message.content?.trim() || "Message";
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (!ms || ms < 0) return "0:00";
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
