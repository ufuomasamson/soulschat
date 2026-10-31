"use client";

import { Button, Input, useToast } from "@/components/ui";
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  RELATIONSHIP_OPTIONS,
  type GenderValue,
  type RelationshipValue,
} from "@/lib/auth/constants";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import type { ProfileMediaItem, UserProfile } from "@/lib/profile/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ProfileMediaManager } from "./ProfileMediaManager";

export function EditProfileForm({
  profile,
  initialMedia,
}: {
  profile: UserProfile;
  initialMedia: ProfileMediaItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [gender, setGender] = useState<GenderValue | "">(
    (profile.gender as GenderValue) || "",
  );
  const [intention, setIntention] = useState<RelationshipValue | "">(
    (profile.relationship_intention as RelationshipValue) || "",
  );
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profile.avatar_url;
  }, [avatarFile, profile.avatar_url]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(supabase, profile.id, avatarFile);
      }

      await updateProfile(supabase, profile.id, {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        gender: gender || null,
        relationship_intention: intention || null,
        interests,
        avatar_url: avatarUrl,
      });

      toast({ title: "Profile updated", tone: "success" });
      router.push("/settings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 px-4 py-4">
      <div className="flex flex-col items-center gap-3">
        <label className="relative cursor-pointer">
          <span className="flex size-28 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-light text-[28px] font-semibold text-primary">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={name || "Profile"}
                className="size-full object-cover"
              />
            ) : (
              (name.trim().slice(0, 1).toUpperCase() || "S")
            )}
          </span>
          <span className="absolute right-1 bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-text-inverse shadow-[var(--shadow-subtle)]">
            <Camera className="size-4" strokeWidth={1.75} />
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="text-[13px] text-text-secondary">Change photo</p>
      </div>

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />

      <label className="flex w-full flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text-primary">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          className={cn(
            "w-full resize-none rounded-[var(--radius-xl)] border border-border bg-background px-3.5 py-3",
            "text-[15px] text-text-primary placeholder:text-text-muted",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
          )}
          placeholder="Tell people a little about yourself"
        />
        <span className="text-[12px] text-text-muted">{bio.length}/500</span>
      </label>

      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="City, Country"
      />

      <div>
        <p className="mb-2 text-[13px] font-medium text-text-primary">Gender</p>
        <div className="grid gap-2">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              className={cn(
                "h-11 rounded-[var(--radius-xl)] border px-4 text-left text-[15px]",
                gender === option.value
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border text-text-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-text-primary">
          Looking for
        </p>
        <div className="grid gap-2">
          {RELATIONSHIP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setIntention(option.value)}
              className={cn(
                "h-11 rounded-[var(--radius-xl)] border px-4 text-left text-[15px]",
                intention === option.value
                  ? "border-primary bg-primary-light text-primary-dark"
                  : "border-border text-text-primary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-medium text-text-primary">
          Interests
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() =>
                  setInterests((prev) =>
                    selected
                      ? prev.filter((i) => i !== interest)
                      : [...prev, interest],
                  )
                }
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[13px] font-medium",
                  selected
                    ? "border-primary bg-primary text-text-inverse"
                    : "border-border text-text-secondary",
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <ProfileMediaManager userId={profile.id} initialMedia={initialMedia} />

      {error ? (
        <p className="text-[13px] text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-auto pt-2 pb-4">
        <Button type="submit" fullWidth size="lg" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
