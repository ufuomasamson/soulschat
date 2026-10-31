"use client";

import { Button, Input, Logo } from "@/components/ui";
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  isAtLeastAge,
  looksLikeEmail,
  MIN_AGE,
  type GenderValue,
} from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Camera, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { BrandMark } from "./AuthShell";

const STEPS = [
  "Account",
  "About you",
  "Birthday",
  "Gender",
  "Photo",
  "Bio",
  "Location",
  "Interests",
] as const;

type SignupData = {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  gender: GenderValue | "";
  bio: string;
  location: string;
  interests: string[];
  avatarFile: File | null;
};

const initialData: SignupData = {
  email: "",
  password: "",
  name: "",
  dateOfBirth: "",
  gender: "",
  bio: "",
  location: "",
  interests: [],
  avatarFile: null,
};

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SignupData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const previewUrl = useMemo(() => {
    if (!data.avatarFile) return null;
    return URL.createObjectURL(data.avatarFile);
  }, [data.avatarFile]);

  function update<K extends keyof SignupData>(key: K, value: SignupData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep() {
    switch (step) {
      case 0:
        if (!looksLikeEmail(data.email)) {
          return "Enter a valid email address.";
        }
        if (data.password.length < 8) {
          return "Password must be at least 8 characters.";
        }
        return null;
      case 1:
        if (data.name.trim().length < 2) {
          return "Enter your name.";
        }
        return null;
      case 2:
        if (!data.dateOfBirth) {
          return "Enter your date of birth.";
        }
        if (!isAtLeastAge(data.dateOfBirth)) {
          return `You must be at least ${MIN_AGE} to join SoulsChat.`;
        }
        return null;
      case 3:
        if (!data.gender) {
          return "Select an option to continue.";
        }
        return null;
      case 5:
        if (data.bio.trim().length < 8) {
          return "Write a short bio (at least a sentence).";
        }
        return null;
      case 6:
        if (data.location.trim().length < 2) {
          return "Enter your location.";
        }
        return null;
      case 7:
        if (data.interests.length < 1) {
          return "Pick at least one interest.";
        }
        return null;
      default:
        return null;
    }
  }

  function goNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finishSignup() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
            bio: data.bio.trim(),
            location: data.location.trim(),
            interests: data.interests,
          },
        },
      },
    );

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const user = signUpData.user;
    const session = signUpData.session;

    if (user && session) {
      let avatarUrl: string | null = null;

      if (data.avatarFile) {
        const ext = data.avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, data.avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          avatarUrl = publicData.publicUrl;
        }
      }

      await supabase
        .from("profiles")
        .update({
          name: data.name.trim(),
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          bio: data.bio.trim(),
          location: data.location.trim(),
          interests: data.interests,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq("id", user.id);

      setLoading(false);
      router.replace("/chats");
      router.refresh();
      return;
    }

    setLoading(false);
    setNeedsEmailConfirm(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    await finishSignup();
  }

  if (needsEmailConfirm) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <BrandMark className="mt-2" />
        <div className="mt-10 text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">
            Confirm your email
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
            We sent a confirmation link to{" "}
            <span className="font-medium text-text-primary">{data.email}</span>.
            Open it to finish creating your account.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-[var(--radius-xl)] bg-primary text-[16px] font-medium text-text-inverse"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
      <div className="flex items-center justify-between">
        <Logo size="sm" className="rounded-lg" />
        <span className="text-[12px] font-medium text-text-muted">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-background-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mt-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary">
          {stepTitle(step)}
        </h1>
        <p className="mt-1.5 text-[14px] text-text-secondary">
          {stepSubtitle(step)}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-4">
        {step === 0 ? (
          <>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={data.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </>
        ) : null}

        {step === 1 ? (
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            placeholder="Your first name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
          />
        ) : null}

        {step === 2 ? (
          <Input
            label="Date of birth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            hint={`You must be ${MIN_AGE}+ to use SoulsChat.`}
          />
        ) : null}

        {step === 3 ? (
          <div className="grid gap-2">
            {GENDER_OPTIONS.map((option) => {
              const selected = data.gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("gender", option.value)}
                  className={cn(
                    "flex h-12 items-center justify-between rounded-[var(--radius-xl)] border px-4 text-left text-[15px] transition-colors",
                    selected
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-border text-text-primary hover:bg-background-secondary",
                  )}
                >
                  {option.label}
                  {selected ? (
                    <Check className="size-4 text-primary" strokeWidth={2.25} />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <label className="relative cursor-pointer">
              <span
                className={cn(
                  "flex size-28 items-center justify-center overflow-hidden rounded-full",
                  "border border-border bg-background-secondary text-text-muted",
                )}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Camera className="size-8" strokeWidth={1.75} />
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  update("avatarFile", e.target.files?.[0] ?? null)
                }
              />
            </label>
            <p className="text-center text-[13px] text-text-secondary">
              Add a clear photo of yourself. You can skip this for now.
            </p>
          </div>
        ) : null}

        {step === 5 ? (
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-[13px] font-medium text-text-primary">
              Short bio
            </span>
            <textarea
              value={data.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Love music, movies, good conversations..."
              className={cn(
                "w-full resize-none rounded-[var(--radius-xl)] border border-border bg-background px-3.5 py-3",
                "text-[15px] text-text-primary placeholder:text-text-muted",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15",
              )}
            />
            <span className="text-[12px] text-text-muted">
              {data.bio.length}/500
            </span>
          </label>
        ) : null}

        {step === 6 ? (
          <Input
            label="Location"
            placeholder="City, Country"
            value={data.location}
            onChange={(e) => update("location", e.target.value)}
          />
        ) : null}

        {step === 7 ? (
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = data.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
                    update(
                      "interests",
                      selected
                        ? data.interests.filter((i) => i !== interest)
                        : [...data.interests, interest],
                    );
                  }}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-text-inverse"
                      : "border-border text-text-secondary hover:bg-background-secondary",
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex gap-3 pt-6">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={goBack}
              disabled={loading}
            >
              Back
            </Button>
          ) : null}
          <Button
            type="submit"
            className="flex-1"
            size="lg"
            loading={loading}
            fullWidth={step === 0}
          >
            {step === STEPS.length - 1
              ? "Create account"
              : step === 4
                ? data.avatarFile
                  ? "Continue"
                  : "Skip for now"
                : "Continue"}
          </Button>
        </div>
      </form>

      {step === 0 ? (
        <p className="pt-6 text-center text-[14px] text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary-dark"
          >
            Log in
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function stepTitle(step: number) {
  switch (step) {
    case 0:
      return "Create your account";
    case 1:
      return "What's your name?";
    case 2:
      return "When's your birthday?";
    case 3:
      return "How do you identify?";
    case 4:
      return "Add a profile photo";
    case 5:
      return "Write a short bio";
    case 6:
      return "Where are you based?";
    case 7:
      return "What are you into?";
    default:
      return "Sign up";
  }
}

function stepSubtitle(step: number) {
  switch (step) {
    case 0:
      return "Use your email to get started.";
    case 1:
      return "This is how people will see you.";
    case 2:
      return "We use this to keep the community safe.";
    case 3:
      return "Choose the option that fits you best.";
    case 4:
      return "Photos help people recognize you.";
    case 5:
      return "A sentence or two is enough.";
    case 6:
      return "City is fine — keep it simple.";
    case 7:
      return "Pick a few things you enjoy.";
    default:
      return "";
  }
}
