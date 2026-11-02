"use client";

import { Avatar, TopBar, useToast } from "@/components/ui";
import {
  getOwnedLinkGuest,
  setLinkGuestFeedVisibility,
} from "@/lib/advert/actions";
import type { LinkGuestSummary } from "@/lib/advert/types";
import {
  forwardMessage,
  markConversationRead,
  markIncomingDelivered,
  sendMessage,
  softDeleteMessage,
  uploadChatMedia,
} from "@/lib/chat/actions";
import {
  fetchConversationMeta,
  fetchMessages,
} from "@/lib/chat/queries";
import { formatLastSeen } from "@/lib/chat/time";
import type {
  ChatMessage,
  ConversationPreview,
  MessageType,
  ProfileSummary,
} from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer, type ComposerSendPayload } from "./ChatComposer";
import { ForwardPicker } from "./ForwardPicker";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export function ConversationView({ conversationId }: { conversationId: string }) {
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<ProfileSummary | null>(null);
  const [linkGuest, setLinkGuest] = useState<LinkGuestSummary | null>(null);
  const [feedBusy, setFeedBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null);
  const [forwardBusy, setForwardBusy] = useState(false);
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

    async function bootstrap() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You need to be signed in.");
        setLoading(false);
        return;
      }

      try {
        const meta = await fetchConversationMeta(
          supabase,
          conversationId,
          user.id,
        );
        if (!meta) {
          setError("Conversation not found.");
          setLoading(false);
          return;
        }

        const initialMessages = await fetchMessages(supabase, conversationId);
        if (cancelled) return;

        setCurrentUserId(user.id);
        setOtherUser(meta.other_user);
        setMessages(initialMessages);
        setLoading(false);

        try {
          const ownedGuest = await getOwnedLinkGuest(
            supabase,
            meta.other_user.id,
          );
          if (!cancelled) setLinkGuest(ownedGuest);
        } catch {
          if (!cancelled) setLinkGuest(null);
        }

        await markConversationRead(supabase, conversationId);

        const undelivered = initialMessages
          .filter(
            (m) =>
              m.sender_id !== user.id && !m.delivered_at && !m.deleted_at,
          )
          .map((m) => m.id);
        if (undelivered.length) {
          await markIncomingDelivered(supabase, undelivered);
        }

        requestAnimationFrame(scrollToBottom);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load chat.");
        setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const messagesChannel = supabase
      .channel(`messages:${conversationId}`)
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
              const withoutOptimistic = prev.filter(
                (m) =>
                  !(
                    m.optimistic &&
                    m.sender_id === incoming.sender_id &&
                    m.message_type === incoming.message_type &&
                    m.media_url === incoming.media_url &&
                    m.content === incoming.content
                  ),
              );
              return [...withoutOptimistic, incoming];
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

    const profileChannel = otherUser
      ? supabase
          .channel(`profile:${otherUser.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${otherUser.id}`,
            },
            (payload) => {
              const next = payload.new as ProfileSummary;
              setOtherUser((prev) =>
                prev
                  ? {
                      ...prev,
                      online_status: next.online_status,
                      last_seen: next.last_seen,
                      name: next.name,
                      avatar_url: next.avatar_url,
                    }
                  : prev,
              );
            },
          )
          .subscribe()
      : null;

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
      if (profileChannel) void supabase.removeChannel(profileChannel);
      void supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [conversationId, currentUserId, otherUser?.id, scrollToBottom]);

  const subtitle = useMemo(() => {
    if (!otherUser) return "";
    if (peerTyping) return "typing...";
    return formatLastSeen(otherUser.last_seen, otherUser.online_status);
  }, [otherUser, peerTyping]);

  const handleTyping = useCallback(
    (typing: boolean) => {
      if (!currentUserId || !typingChannelRef.current) return;
      void typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing },
      });
    },
    [currentUserId],
  );

  async function handleSend(payload: ComposerSendPayload) {
    if (!currentUserId) return;
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
            ? {
                ...saved,
                reply_preview: optimistic.reply_preview,
              }
            : m,
        ),
      );
      setReplyTo(null);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast({
        title: "Couldn't send",
        description:
          err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    }
  }

  async function handleDelete(message: ChatMessage) {
    if (!currentUserId) return;
    const supabase = createClient();
    try {
      await softDeleteMessage(supabase, message.id, currentUserId);
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description:
          err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    }
  }

  async function handleCopy(message: ChatMessage) {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      toast({ title: "Copied", tone: "success" });
    } catch {
      toast({ title: "Couldn't copy", tone: "error" });
    }
  }

  async function handleToggleFeedVisibility() {
    if (!linkGuest || feedBusy) return;
    setFeedBusy(true);
    const supabase = createClient();
    const next = !linkGuest.show_on_feed;
    try {
      const result = await setLinkGuestFeedVisibility(
        supabase,
        linkGuest.id,
        next,
      );
      setLinkGuest((prev) =>
        prev ? { ...prev, show_on_feed: result.show_on_feed } : prev,
      );
      toast({
        title: result.show_on_feed
          ? "Visible on Feed"
          : "Hidden from Feed",
        description: result.show_on_feed
          ? `${linkGuest.name} can now appear on Discover.`
          : `${linkGuest.name} is hidden from Discover.`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update Feed visibility",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setFeedBusy(false);
    }
  }

  async function handleForwardSelect(target: ConversationPreview) {
    if (!currentUserId || !forwarding) return;
    setForwardBusy(true);
    const supabase = createClient();
    try {
      await forwardMessage(supabase, {
        source: forwarding,
        targetConversationId: target.id,
        senderId: currentUserId,
      });
      toast({
        title: "Forwarded",
        description: `Sent to ${target.other_user.name}`,
        tone: "success",
      });
      setForwarding(null);
    } catch (err) {
      toast({
        title: "Couldn't forward",
        description:
          err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setForwardBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background-chat text-[14px] text-text-secondary">
        Loading conversation...
      </div>
    );
  }

  if (error || !otherUser || !currentUserId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-background-chat px-6 text-center">
        <p className="text-[15px] text-text-secondary">
          {error ?? "Conversation unavailable."}
        </p>
        <Link href="/chats" className="text-[14px] font-medium text-primary">
          Back to chats
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex h-full min-h-0 flex-1 flex-col bg-background-chat">
      <TopBar
        title={otherUser.name}
        subtitle={subtitle}
        bordered
        className="bg-background pr-2 pl-1"
        left={
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-text-primary transition-colors hover:bg-background-secondary"
          >
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </Link>
        }
        right={
          <Link
            href={`/users/${otherUser.id}`}
            aria-label={`${otherUser.name} profile`}
            className="rounded-full p-0.5"
          >
            <Avatar
              name={otherUser.name}
              src={otherUser.avatar_url}
              online={otherUser.online_status}
              size="sm"
            />
          </Link>
        }
      />

      {linkGuest ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-text-primary">
              Private link guest
            </p>
            <p className="truncate text-[12px] text-text-secondary">
              {linkGuest.show_on_feed
                ? "Visible on Feed"
                : "Hidden from Feed by default"}
              {linkGuest.email ? ` · ${linkGuest.email}` : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={feedBusy}
            onClick={() => void handleToggleFeedVisibility()}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
              linkGuest.show_on_feed
                ? "bg-primary text-text-inverse"
                : "bg-background-secondary text-text-primary hover:bg-background-secondary/80",
              feedBusy && "opacity-60",
            )}
          >
            {linkGuest.show_on_feed ? (
              <Eye className="size-3.5" strokeWidth={1.75} />
            ) : (
              <EyeOff className="size-3.5" strokeWidth={1.75} />
            )}
            {linkGuest.show_on_feed ? "On Feed" : "Show on Feed"}
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
        <div className="mt-auto flex flex-col gap-2">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-text-muted">
              Say hello to start the conversation.
            </p>
          ) : null}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onForward={setForwarding}
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

      {forwarding ? (
        <ForwardPicker
          excludeConversationId={conversationId}
          busy={forwardBusy}
          onClose={() => {
            if (!forwardBusy) setForwarding(null);
          }}
          onSelect={(conversation) => void handleForwardSelect(conversation)}
        />
      ) : null}
    </div>
  );
}
