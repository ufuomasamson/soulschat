"use client";

import { ChatComposer, type ComposerSendPayload } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useToast } from "@/components/ui";
import { trackFacebookEvent } from "@/components/advert/FacebookPixel";
import {
  markConversationRead,
  markIncomingDelivered,
  sendMessage,
  softDeleteMessage,
  uploadChatMedia,
} from "@/lib/chat/actions";
import { fetchMessages } from "@/lib/chat/queries";
import type { ChatMessage, MessageType, ProfileSummary } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

export function GuestChatPanel({
  conversationId,
  currentUserId,
  otherUser,
}: {
  conversationId: string;
  currentUserId: string;
  otherUser: ProfileSummary;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function boot() {
      try {
        const rows = await fetchMessages(supabase, conversationId);
        if (cancelled) return;
        setMessages(rows);
        setLoading(false);
        await markConversationRead(supabase, conversationId);
        const undelivered = rows
          .filter(
            (m) =>
              m.sender_id !== currentUserId && !m.delivered_at && !m.deleted_at,
          )
          .map((m) => m.id);
        if (undelivered.length) {
          await markIncomingDelivered(supabase, undelivered);
        }
        requestAnimationFrame(scrollToBottom);
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          toast({
            title: "Couldn't load chat",
            description: err instanceof Error ? err.message : "Try again.",
            tone: "error",
          });
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserId, scrollToBottom, toast]);

  useEffect(() => {
    const supabase = createClient();
    const messagesChannel = supabase
      .channel(`guest-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [
                ...prev.filter(
                  (m) =>
                    !(
                      m.optimistic &&
                      m.sender_id === incoming.sender_id &&
                      m.content === incoming.content &&
                      m.message_type === incoming.message_type
                    ),
                ),
                incoming,
              ];
            });
            if (incoming.sender_id !== currentUserId) {
              await markIncomingDelivered(supabase, [incoming.id]);
              await markConversationRead(supabase, conversationId);
            }
            requestAnimationFrame(scrollToBottom);
          }
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as ChatMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
            );
          }
        },
      )
      .subscribe();

    const typingChannel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });
    typingChannel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === currentUserId) return;
        setPeerTyping(Boolean(payload?.typing));
        if (payload?.typing) {
          window.setTimeout(() => setPeerTyping(false), 1600);
        }
      })
      .subscribe();
    typingChannelRef.current = typingChannel;

    return () => {
      void supabase.removeChannel(messagesChannel);
      void supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, currentUserId, scrollToBottom]);

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (!typingChannelRef.current) return;
      void typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing },
      });
    },
    [currentUserId],
  );

  async function handleSend(payload: ComposerSendPayload) {
    const supabase = createClient();
    let mediaUrl: string | null = null;
    let mediaName: string | null = null;
    let mediaSize: number | null = null;
    let mediaMime: string | null = null;
    let mediaDurationMs: number | null = payload.durationMs ?? null;
    let messageType: MessageType = "text";
    let content = payload.content;

    if (payload.file) {
      const kind =
        payload.kind ??
        (payload.file.type.startsWith("image/") ? "image" : "file");
      const uploaded = await uploadChatMedia(
        supabase,
        currentUserId,
        payload.file,
        kind,
      );
      mediaUrl = uploaded.url;
      mediaName = uploaded.name;
      mediaSize = uploaded.size;
      mediaMime = uploaded.mime;
      messageType = kind;
      if (!content) content = "";
    }

    if (!content && !mediaUrl) return;

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      media_name: mediaName,
      media_size: mediaSize,
      media_mime: mediaMime,
      media_duration_ms: mediaDurationMs,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      reply_to: payload.replyTo ?? null,
      deleted_at: null,
      optimistic: true,
      reply_preview: replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            sender_id: replyTo.sender_id,
            message_type: replyTo.message_type,
            media_name: replyTo.media_name,
            deleted_at: replyTo.deleted_at,
          }
        : null,
    };

    setMessages((prev) => [...prev, optimistic]);
    requestAnimationFrame(scrollToBottom);

    try {
      const saved = await sendMessage(supabase, {
        conversationId,
        senderId: currentUserId,
        content,
        messageType,
        mediaUrl,
        mediaName,
        mediaSize,
        mediaMime,
        mediaDurationMs,
        replyTo: payload.replyTo ?? null,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...saved, reply_preview: optimistic.reply_preview }
            : m,
        ),
      );
      setReplyTo(null);
      trackFacebookEvent("Contact");
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({
        title: "Couldn't send",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    }
  }

  async function handleDelete(message: ChatMessage) {
    const supabase = createClient();
    try {
      await softDeleteMessage(supabase, message.id, currentUserId);
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[14px] text-text-secondary">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background-chat">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
        <div className="mt-auto flex flex-col gap-2">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-text-muted">
              Say hello to {otherUser.name}.
            </p>
          ) : null}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onCopy={async (m) => {
                if (!m.content) return;
                try {
                  await navigator.clipboard.writeText(m.content);
                  toast({ title: "Copied", tone: "success" });
                } catch {
                  toast({ title: "Couldn't copy", tone: "error" });
                }
              }}
            />
          ))}
          {peerTyping ? <TypingIndicator name={otherUser.name} /> : null}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatComposer
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
