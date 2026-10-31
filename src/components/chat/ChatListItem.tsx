"use client";

import { Avatar, Badge } from "@/components/ui";
import { formatConversationTime } from "@/lib/chat/time";
import type { ConversationPreview } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ChatListItem({
  conversation,
  active,
}: {
  conversation: ConversationPreview;
  active?: boolean;
}) {
  const unread = conversation.unread_count > 0;

  return (
    <Link
      href={`/chats/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-150",
        "hover:bg-background-secondary active:bg-background-chat",
        active && "bg-primary-light/60 hover:bg-primary-light/60",
      )}
    >
      <Avatar
        name={conversation.other_user.name}
        src={conversation.other_user.avatar_url}
        online={conversation.other_user.online_status}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3
            className={cn(
              "truncate text-[16px] text-text-primary",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {conversation.other_user.name}
          </h3>
          <time
            className={cn(
              "shrink-0 text-[12px] tabular-nums",
              unread ? "font-medium text-primary" : "text-text-muted",
            )}
          >
            {formatConversationTime(conversation.last_message_at)}
          </time>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <p
            className={cn(
              "truncate text-[14px]",
              unread ? "font-medium text-text-primary" : "text-text-secondary",
            )}
          >
            {conversation.last_message_preview || "No messages yet"}
          </p>
          {unread ? (
            <Badge count={conversation.unread_count} className="shrink-0" />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
