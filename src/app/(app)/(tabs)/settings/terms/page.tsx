import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Terms of Service" />
      <div className="space-y-3 overflow-y-auto px-4 py-4 text-[14px] leading-relaxed text-text-secondary">
        <p>
          By using SoulsChat you agree to treat others respectfully, only create
          an account if you are 18 or older, and not use the app for harassment,
          spam, or illegal activity.
        </p>
        <p>
          We may suspend accounts that violate these terms. These placeholder
          terms will be replaced with a full legal document before public
          launch.
        </p>
      </div>
    </div>
  );
}
