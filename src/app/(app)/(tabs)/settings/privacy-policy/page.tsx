import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Privacy Policy" />
      <div className="space-y-3 overflow-y-auto px-4 py-4 text-[14px] leading-relaxed text-text-secondary">
        <p>
          SoulsChat stores the profile and chat information you provide so you
          can connect with others. You can control online status, last seen, and
          friend request visibility in Privacy settings.
        </p>
        <p>
          This is a product placeholder privacy notice and will be replaced with
          a complete policy before public launch.
        </p>
      </div>
    </div>
  );
}
