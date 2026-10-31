"use client";

import { formatMessageTime } from "@/lib/chat/time";
import {
  formatDurationMs,
  formatFileSize,
  getMessagePreviewLabel,
  getMessageStatus,
  type ChatMessage,
} from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
  Download,
  FileText,
  Forward,
  MoreVertical,
  Pause,
  Play,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { MediaLightbox } from "./MediaLightbox";

export function MessageBubble({
  message,
  currentUserId,
  onReply,
  onDelete,
  onCopy,
  onForward,
}: {
  message: ChatMessage;
  currentUserId: string;
  onReply?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
}) {
  const mine = message.sender_id === currentUserId;
  const status = getMessageStatus(message, currentUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const deleted = Boolean(message.deleted_at);
  const isPhoto =
    !deleted && message.message_type === "image" && Boolean(message.media_url);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    };
  }, []);

  function clearLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function startLongPress() {
    if (deleted || isPhoto) return;
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setMenuOpen(true);
    }, 420);
  }

  function openMenu() {
    if (deleted || isPhoto) return;
    setMenuOpen(true);
  }

  function handleBubbleClick() {
    if (deleted || isPhoto) return;
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    openMenu();
  }

  async function sharePhoto() {
    if (!message.media_url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: message.media_name || "Photo",
          url: message.media_url,
        });
        return;
      }
      await navigator.clipboard.writeText(message.media_url);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(message.media_url);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div
      className={cn(
        "relative flex w-full",
        mine ? "justify-end" : "justify-start",
      )}
      onContextMenu={(e) => {
        if (isPhoto) {
          e.preventDefault();
          setPhotoMenuOpen(true);
          return;
        }
        e.preventDefault();
        openMenu();
      }}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-[18px] text-left shadow-[var(--shadow-subtle)]",
          isPhoto ? "overflow-hidden p-1.5" : "px-3.5 py-2",
          !isPhoto &&
            "transition-transform active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          mine
            ? "rounded-br-md bg-primary-light text-text-primary"
            : "rounded-bl-md bg-background text-text-primary",
          deleted && "opacity-70",
        )}
        role={isPhoto ? undefined : "button"}
        tabIndex={isPhoto || deleted ? undefined : 0}
        aria-label={isPhoto ? undefined : "Message actions"}
        onClick={isPhoto ? undefined : handleBubbleClick}
        onKeyDown={
          isPhoto
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openMenu();
                }
              }
        }
        onPointerDown={
          isPhoto
            ? undefined
            : (e: ReactPointerEvent) => {
                if (e.button !== 0) return;
                startLongPress();
              }
        }
        onPointerUp={isPhoto ? undefined : clearLongPress}
        onPointerLeave={isPhoto ? undefined : clearLongPress}
        onPointerCancel={isPhoto ? undefined : clearLongPress}
      >
        {message.reply_preview ? (
          <div className="mb-1.5 rounded-lg border-l-2 border-primary bg-background/60 px-2 py-1">
            <p className="truncate text-[12px] font-medium text-primary">
              Reply
            </p>
            <p className="truncate text-[12px] text-text-secondary">
              {getMessagePreviewLabel(message.reply_preview)}
            </p>
          </div>
        ) : null}

        {deleted ? (
          <p className="px-2 py-1 text-[15px] italic text-text-muted">
            This message was deleted
          </p>
        ) : (
          <>
            {isPhoto ? (
              <div className="relative overflow-hidden rounded-[14px]">
                <button
                  type="button"
                  className="block w-full"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="View photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.media_url!}
                    alt={message.media_name || "Shared photo"}
                    className="max-h-72 w-full object-cover"
                    draggable={false}
                  />
                </button>

                <button
                  type="button"
                  aria-label="Photo options"
                  aria-haspopup="menu"
                  aria-expanded={photoMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoMenuOpen(true);
                  }}
                  className={cn(
                    "absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center",
                    "rounded-full bg-black/45 text-white backdrop-blur-sm",
                    "transition-colors hover:bg-black/60 active:scale-95",
                  )}
                >
                  <MoreVertical className="size-4" strokeWidth={2} />
                </button>
              </div>
            ) : null}

            {message.message_type === "file" && message.media_url ? (
              <FileAttachment message={message} />
            ) : null}

            {message.message_type === "voice" && message.media_url ? (
              <VoicePlayer
                src={message.media_url}
                durationMs={message.media_duration_ms}
                onInteract={() => {
                  longPressTriggered.current = true;
                }}
              />
            ) : null}

            {message.content ? (
              <p
                className={cn(
                  "whitespace-pre-wrap text-[15px] leading-relaxed",
                  isPhoto && "mt-1.5 px-1.5",
                )}
              >
                {message.content}
              </p>
            ) : null}
          </>
        )}

        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[11px] text-text-muted",
            isPhoto && "px-1.5 pb-0.5",
          )}
        >
          <time dateTime={message.created_at}>
            {formatMessageTime(message.created_at)}
          </time>
          {mine && status ? (
            status === "read" ? (
              <CheckCheck
                className="size-3.5 text-primary"
                strokeWidth={2}
                aria-label="Read"
              />
            ) : status === "delivered" ? (
              <CheckCheck
                className="size-3.5"
                strokeWidth={2}
                aria-label="Delivered"
              />
            ) : (
              <Check
                className="size-3.5"
                strokeWidth={2}
                aria-label={status === "sending" ? "Sending" : "Sent"}
              />
            )
          ) : null}
        </div>
      </div>

      {mounted && photoMenuOpen && isPhoto
        ? createPortal(
            <PhotoActionsSheet
              mine={mine}
              onClose={() => setPhotoMenuOpen(false)}
              onForward={() => {
                setPhotoMenuOpen(false);
                onForward?.(message);
              }}
              onShare={async () => {
                setPhotoMenuOpen(false);
                await sharePhoto();
              }}
              onDelete={() => {
                setPhotoMenuOpen(false);
                onDelete?.(message);
              }}
            />,
            document.body,
          )
        : null}

      {mounted && menuOpen && !deleted && !isPhoto
        ? createPortal(
            <MessageActionsSheet
              message={message}
              mine={mine}
              onClose={() => setMenuOpen(false)}
              onReply={() => {
                onReply?.(message);
                setMenuOpen(false);
              }}
              onForward={() => {
                onForward?.(message);
                setMenuOpen(false);
              }}
              onCopy={() => {
                onCopy?.(message);
                setMenuOpen(false);
              }}
              onOpenFile={() => {
                if (message.media_url) {
                  window.open(
                    message.media_url,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }
                setMenuOpen(false);
              }}
              onDelete={() => {
                onDelete?.(message);
                setMenuOpen(false);
              }}
            />,
            document.body,
          )
        : null}

      {lightboxOpen && message.media_url ? (
        <MediaLightbox
          src={message.media_url}
          alt={message.media_name || "Shared photo"}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}

function PhotoActionsSheet({
  mine,
  onClose,
  onForward,
  onShare,
  onDelete,
}: {
  mine: boolean;
  onClose: () => void;
  onForward: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close photo actions"
        onClick={onClose}
      />
      <div
        role="menu"
        aria-label="Photo actions"
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden",
          "rounded-t-[var(--radius-2xl)] bg-background shadow-[var(--shadow-subtle)]",
          "sm:rounded-[var(--radius-2xl)]",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[15px] font-semibold text-text-primary">Photo</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)] text-text-secondary hover:bg-background-secondary"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="py-1">
          <MenuItem icon={Forward} label="Forward" onClick={onForward} />
          <MenuItem icon={Share2} label="Share" onClick={onShare} />
          {mine ? (
            <MenuItem icon={Trash2} label="Delete" danger onClick={onDelete} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MessageActionsSheet({
  message,
  mine,
  onClose,
  onReply,
  onForward,
  onCopy,
  onOpenFile,
  onDelete,
}: {
  message: ChatMessage;
  mine: boolean;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onOpenFile: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close message actions"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Message actions"
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden",
          "rounded-t-[var(--radius-2xl)] bg-background shadow-[var(--shadow-subtle)]",
          "sm:rounded-[var(--radius-2xl)]",
          "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-text-primary">
              Message actions
            </p>
            <p className="truncate text-[13px] text-text-secondary">
              {getMessagePreviewLabel(message)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-lg)] text-text-secondary hover:bg-background-secondary"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="py-1">
          <MenuItem icon={CornerUpLeft} label="Reply" onClick={onReply} />
          <MenuItem icon={Forward} label="Forward" onClick={onForward} />
          {message.content ? (
            <MenuItem icon={Copy} label="Copy" onClick={onCopy} />
          ) : null}
          {message.message_type === "file" && message.media_url ? (
            <MenuItem icon={Download} label="Open file" onClick={onOpenFile} />
          ) : null}
          {mine ? (
            <MenuItem icon={Trash2} label="Delete" danger onClick={onDelete} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FileAttachment({ message }: { message: ChatMessage }) {
  const sizeLabel = formatFileSize(message.media_size);
  return (
    <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-background/70 px-3 py-2.5">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <FileText className="size-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-text-primary">
          {message.media_name || "File"}
        </span>
        <span className="block text-[12px] text-text-secondary">
          {sizeLabel || "Tap for options"}
        </span>
      </span>
      <Download className="size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
    </div>
  );
}

function VoicePlayer({
  src,
  durationMs,
  onInteract,
}: {
  src: string;
  durationMs: number | null;
  onInteract?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);
  const [knownDuration, setKnownDuration] = useState(durationMs ?? 0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTime = () => {
      setCurrentMs(audio.currentTime * 1000);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
        setKnownDuration(audio.duration * 1000);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentMs(0);
    };
    const onMeta = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setKnownDuration(audio.duration * 1000);
      }
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onMeta);
      audioRef.current = null;
    };
  }, [src]);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    onInteract?.();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="mb-1.5 flex min-w-[200px] items-center gap-2.5 rounded-xl bg-background/70 px-2.5 py-2">
      <button
        type="button"
        onClick={(e) => void toggle(e)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-text-inverse"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
      >
        {playing ? (
          <Pause className="size-4 fill-current" strokeWidth={1.75} />
        ) : (
          <Play className="size-4 fill-current" strokeWidth={1.75} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] tabular-nums text-text-muted">
          {formatDurationMs(playing || currentMs > 0 ? currentMs : knownDuration)}
        </p>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px]",
        "hover:bg-background-secondary active:bg-background-chat",
        danger ? "text-error" : "text-text-primary",
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
