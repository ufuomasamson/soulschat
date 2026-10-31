import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import { fetchProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account",
};

export const instant = false;

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const profile = await fetchProfile(supabase, userId);
  const email =
    profile?.email ??
    (typeof data?.claims?.email === "string" ? data.claims.email : "—");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Account" />
      <div className="px-4 py-4">
        <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-border">
          <div className="px-4 py-3.5">
            <p className="text-[12px] font-medium tracking-wide text-text-muted uppercase">
              Email
            </p>
            <p className="mt-1 text-[15px] text-text-primary">{email}</p>
          </div>
          <div className="border-t border-border px-4 py-3.5">
            <p className="text-[12px] font-medium tracking-wide text-text-muted uppercase">
              Name
            </p>
            <p className="mt-1 text-[15px] text-text-primary">
              {profile?.name ?? "—"}
            </p>
          </div>
        </section>
        <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">
          Password changes and account deletion will be available in a later
          update.
        </p>
      </div>
    </div>
  );
}
