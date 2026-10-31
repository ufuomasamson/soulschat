"use client";

import { IconButton } from "@/components/ui";
import {
  formatDurationMs,
  getMessagePreviewLabel,
  type ChatMessage,
} from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import {
  FilePlus2,
  ImagePlus,
  Mic,
  Paperclip,
  SendHorizontal,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

const EMOJIS = ["😀", "😂", "😍", "🔥", "👍", "🙏", "🎉", "💯", "🥰", "😎"];

export type ComposerSendPayload = {
  content: string;
  file?: File | null;
  kind?: "image" | "file" | "voice";
  durationMs?: number | null;
  replyTo?: string | null;
};

export function ChatComposer({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
}: {
  onSend: (payload: ComposerSendPayload) => Promise<void> | void;
  onTyping?: (typing: boolean) => void;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartedAt = useRef<number>(0);
  const recordTimer = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    return () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
      if (recordTimer.current) window.clearInterval(recordTimer.current);
      stopStream();
      onTyping?.(false);
    };
  }, [onTyping]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function emitTyping() {
    onTyping?.(true);
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      onTyping?.(false);
    }, 1200);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || disabled) return;

    setSending(true);
    onTyping?.(false);
    try {
      await onSend({
        content: value,
        replyTo: replyTo?.id ?? null,
      });
      setText("");
      setShowEmoji(false);
      onCancelReply?.();
    } finally {
      setSending(false);
    }
  }

  async function handlePickedFile(
    e: ChangeEvent<HTMLInputElement>,
    kind: "image" | "file",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setAttachOpen(false);
    if (!file || sending || disabled) return;

    setSending(true);
    onTyping?.(false);
    try {
      await onSend({
        content: text.trim(),
        file,
        kind,
        replyTo: replyTo?.id ?? null,
      });
      setText("");
      onCancelReply?.();
    } finally {
      setSending(false);
    }
  }

  async function startRecording() {
    if (sending || disabled || recording) return;
    setAttachOpen(false);
    setShowEmoji(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined;

      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recordStartedAt.current = Date.now();
      setRecordMs(0);
      setRecording(true);

      recordTimer.current = window.setInterval(() => {
        setRecordMs(Date.now() - recordStartedAt.current);
      }, 200);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(250);
    } catch {
      stopStream();
      setRecording(false);
    }
  }

  function cancelRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (recordTimer.current) window.clearInterval(recordTimer.current);
    stopStream();
    setRecording(false);
    setRecordMs(0);
  }

  async function stopAndSendRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cancelRecording();
      return;
    }

    const durationMs = Date.now() - recordStartedAt.current;
    if (recordTimer.current) window.clearInterval(recordTimer.current);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    stopStream();
    mediaRecorderRef.current = null;
    setRecording(false);

    const blob = new Blob(chunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    });
    chunksRef.current = [];

    if (blob.size < 500 || durationMs < 400) {
      setRecordMs(0);
      return;
    }

    const ext = blob.type.includes("mp4") ? "m4a" : "webm";
    const file = new File([blob], `voice-note.${ext}`, {
      type: blob.type || "audio/webm",
    });

    setSending(true);
    onTyping?.(false);
    try {
      await onSend({
        content: "",
        file,
        kind: "voice",
        durationMs,
        replyTo: replyTo?.id ?? null,
      });
      onCancelReply?.();
    } finally {
      setSending(false);
      setRecordMs(0);
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-background">
      {replyTo ? (
        <div className="flex items-start gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-[12px] font-medium text-primary">Replying</p>
            <p className="truncate text-[13px] text-text-secondary">
              {getMessagePreviewLabel(replyTo)}
            </p>
          </div>
          <IconButton label="Cancel reply" size="sm" onClick={onCancelReply}>
            <X className="size-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : null}

      {showEmoji ? (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded-lg px-2 py-1 text-[20px] hover:bg-background-secondary"
              onClick={() => {
                setText((prev) => prev + emoji);
                emitTyping();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {attachOpen ? (
        <div className="flex gap-2 border-b border-border px-3 py-2">
          <button
            type="button"
            disabled={disabled || sending || recording}
            onClick={() => imageRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-background-secondary px-3 py-2 text-[13px] font-medium text-text-primary hover:bg-primary-light disabled:opacity-60"
          >
            <ImagePlus className="size-4 text-primary" strokeWidth={1.75} />
            Photo
          </button>
          <button
            type="button"
            disabled={disabled || sending || recording}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-background-secondary px-3 py-2 text-[13px] font-medium text-text-primary hover:bg-primary-light disabled:opacity-60"
          >
            <FilePlus2 className="size-4 text-primary" strokeWidth={1.75} />
            File
          </button>
        </div>
      ) : null}

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePickedFile(e, "image")}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip"
        className="hidden"
        onChange={(e) => handlePickedFile(e, "file")}
      />

      {recording ? (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          )}
        >
          <IconButton
            label="Cancel voice note"
            tone="muted"
            onClick={cancelRecording}
          >
            <Trash2 className="size-5 text-error" strokeWidth={1.75} />
          </IconButton>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-2xl)] bg-primary-light px-4 py-2.5">
            <span className="size-2.5 animate-pulse rounded-full bg-error" />
            <span className="text-[14px] font-medium text-text-primary">
              Recording {formatDurationMs(recordMs)}
            </span>
          </div>
          <IconButton
            label="Send voice note"
            tone="primary"
            className="bg-primary text-text-inverse hover:bg-primary-dark hover:text-text-inverse"
            onClick={() => void stopAndSendRecording()}
          >
            <Square className="size-4 fill-current" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex items-end gap-1.5 px-2 py-2",
            "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          )}
        >
          <IconButton
            label="Add emoji"
            tone="muted"
            className="mb-0.5 shrink-0"
            onClick={() => {
              setAttachOpen(false);
              setShowEmoji((v) => !v);
            }}
            disabled={disabled || sending}
          >
            <Smile className="size-5" strokeWidth={1.75} />
          </IconButton>

          <IconButton
            label="Attach"
            tone="muted"
            className="mb-0.5 shrink-0"
            onClick={() => {
              setShowEmoji(false);
              setAttachOpen((v) => !v);
            }}
            disabled={disabled || sending}
          >
            <Paperclip className="size-5" strokeWidth={1.75} />
          </IconButton>

          <div className="min-w-0 flex-1">
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping();
              }}
              placeholder="Type a message..."
              aria-label="Message"
              disabled={disabled || sending}
              className={cn(
                "h-11 w-full rounded-[var(--radius-2xl)] border border-border bg-background-secondary",
                "px-4 text-[15px] text-text-primary placeholder:text-text-muted",
                "transition-colors focus:border-primary/40 focus:bg-background focus:outline-none",
                "disabled:opacity-60",
              )}
            />
          </div>

          {hasText ? (
            <IconButton
              type="submit"
              label="Send"
              tone="primary"
              disabled={disabled || sending}
              className="mb-0.5 shrink-0 bg-primary text-text-inverse hover:bg-primary-dark hover:text-text-inverse"
            >
              <SendHorizontal className="size-5" strokeWidth={1.75} />
            </IconButton>
          ) : (
            <IconButton
              label="Record voice note"
              tone="muted"
              className="mb-0.5 shrink-0"
              disabled={disabled || sending}
              onClick={() => void startRecording()}
            >
              <Mic className="size-5" strokeWidth={1.75} />
            </IconButton>
          )}
        </form>
      )}
    </div>
  );
}
