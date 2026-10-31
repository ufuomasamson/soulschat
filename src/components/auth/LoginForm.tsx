"use client";

import { Button, Input } from "@/components/ui";
import { looksLikeEmail } from "@/lib/auth/constants";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const value = identifier.trim();
    if (!value || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (!looksLikeEmail(value)) {
      setError("Enter a valid email address. Phone login is coming soon.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: value,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/chats");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
      <BrandMark className="mt-2" />

      <div className="mt-10 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-text-primary">
          Welcome back
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
          Connect with people and start a conversation.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="Phone number or email"
          name="identifier"
          type="text"
          autoComplete="username"
          inputMode="email"
          placeholder="you@email.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="text-[13px] text-error" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-[14px] font-medium text-primary hover:text-primary-dark"
        >
          Forgot password?
        </Link>
      </div>

      <p className="mt-auto pt-10 text-center text-[14px] text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary-dark"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
