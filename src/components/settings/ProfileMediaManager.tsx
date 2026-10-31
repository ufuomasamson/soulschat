"use client";

import { useToast } from "@/components/ui";
import {
  deleteProfileMedia,
  uploadProfileMedia,
} from "@/lib/profile/actions";
import type { ProfileMediaItem } from "@/lib/profile/types";
import { MAX_PROFILE_MEDIA } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";

export function ProfileMediaManager({
  userId,
  initialMedia,
}: {
  userId: string;
  initialMedia: ProfileMediaItem[];
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canAdd = media.length < MAX_PROFILE_MEDIA;

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !canAdd) return;

    const remaining = MAX_PROFILE_MEDIA - media.length;
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    const supabase = createClient();

    try {
      let next = [...media];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) continue;
        const item = await uploadProfileMedia(
          supabase,
          userId,
          file,
          next.length,
        );
        next = [...next, item];
        setMedia(next);
      }
      toast({
        title:
          selected.length > 1 ? "Photos uploaded" : "Photo uploaded",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't upload photo",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(item: ProfileMediaItem) {
    setDeletingId(item.id);
    const supabase = createClient();
    try {
      await deleteProfileMedia(supabase, userId, item);
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      toast({ title: "Photo removed" });
    } catch (err) {
      toast({
        title: "Couldn't remove photo",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-text-primary">Photos</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Add up to {MAX_PROFILE_MEDIA} photos for your public profile.
          </p>
        </div>
        <span className="text-[12px] tabular-nums text-text-muted">
          {media.length}/{MAX_PROFILE_MEDIA}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-background-secondary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt="Profile media"
              className="size-full object-cover"
            />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={deletingId === item.id || uploading}
              onClick={() => handleDelete(item)}
              className={cn(
                "absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full",
                "bg-black/55 text-white backdrop-blur-sm transition-opacity",
                "hover:bg-black/70 disabled:opacity-50",
              )}
            >
              {deletingId === item.id ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" strokeWidth={2} />
              )}
            </button>
          </div>
        ))}

        {canAdd ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)]",
              "border border-dashed border-border bg-background-secondary",
              "text-text-secondary transition-colors hover:bg-background-chat",
              "disabled:opacity-60",
            )}
          >
            {uploading ? (
              <LoaderCircle className="size-6 animate-spin text-primary" />
            ) : (
              <ImagePlus className="size-6 text-primary" strokeWidth={1.75} />
            )}
            <span className="text-[12px] font-medium">
              {uploading ? "Uploading..." : "Add photo"}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
    </section>
  );
}
