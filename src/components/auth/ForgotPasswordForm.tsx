"use client";

import { Button, Input } from "@/components/ui";
import { looksLikeEmail } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "./AuthShell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const value = email.trim();
    if (!looksLikeEmail(value)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      value,
      {
        redirectTo: `${window.location.origin}/login`,
      },
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
      <BrandMark className="mt-2" />

      <div className="mt-10 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">
          Reset password
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
          We&apos;ll send a reset link to your email.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-[var(--radius-xl)] bg-primary-light px-4 py-4 text-center">
          <p className="text-[14px] font-medium text-primary-dark">
            Check your inbox
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            If an account exists for that email, a reset link is on the way.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? (
            <p className="text-[13px] text-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-auto pt-10 text-center text-[14px] text-text-secondary">
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-dark"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
