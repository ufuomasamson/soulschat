import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar, TopBar } from "@/components/ui";
import { fetchProfile } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Lock,
  Megaphone,
  Shield,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings",
};

export const instant = false;

const sections = [
  {
    items: [
      { label: "Account", icon: UserRound, href: "/settings/account" },
      { label: "Privacy", icon: Lock, href: "/settings/privacy" },
      { label: "Notifications", icon: Bell, href: "/settings/help" },
      { label: "Security", icon: Shield, href: "/settings/account" },
    ],
  },
  {
    items: [
      { label: "Advert", icon: Megaphone, href: "/settings/advert" },
      { label: "Blocked Users", icon: Shield, href: "/settings/blocked" },
      { label: "Help & Support", icon: CircleHelp, href: "/settings/help" },
    ],
  },
  {
    items: [
      { label: "Terms of Service", icon: FileText, href: "/settings/terms" },
      {
        label: "Privacy Policy",
        icon: FileText,
        href: "/settings/privacy-policy",
      },
    ],
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const profile = await fetchProfile(supabase, userId);
  const profileName = profile?.name || "Your profile";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar title="Settings" bordered={false} className="px-3" />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <Link
          href="/settings/edit-profile"
          className={cn(
            "mt-2 flex items-center gap-3 rounded-[var(--radius-2xl)] p-3",
            "transition-colors duration-150 hover:bg-background-secondary",
          )}
        >
          <Avatar name={profileName} src={avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold text-text-primary">
              {profileName}
            </p>
            <p className="text-[14px] text-primary">Edit Profile</p>
          </div>
          <ChevronRight
            className="size-5 text-text-muted"
            strokeWidth={1.75}
          />
        </Link>

        <div className="mt-2 px-3">
          <Link
            href={`/users/${userId}`}
            className="text-[13px] font-medium text-text-secondary hover:text-primary"
          >
            View my public profile
          </Link>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map((section, sectionIndex) => (
            <section
              key={sectionIndex}
              className="overflow-hidden rounded-[var(--radius-2xl)] border border-border"
            >
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      "transition-colors duration-150 hover:bg-background-secondary",
                      index > 0 && "border-t border-border",
                    )}
                  >
                    <Icon
                      className="size-[20px] text-text-secondary"
                      strokeWidth={1.75}
                    />
                    <span className="flex-1 text-[15px] text-text-primary">
                      {item.label}
                    </span>
                    <ChevronRight
                      className="size-4 text-text-muted"
                      strokeWidth={1.75}
                    />
                  </Link>
                );
              })}
            </section>
          ))}

          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
