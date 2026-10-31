import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support",
};

export default function HelpPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Help & Support" />
      <div className="space-y-4 px-4 py-4 text-[14px] leading-relaxed text-text-secondary">
        <p>
          Need help with SoulsChat? Start with these basics:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use Discover to find people and send friend requests.</li>
          <li>Accept requests in Friends → Requests.</li>
          <li>Message friends from Friends or an open chat.</li>
          <li>Block or report someone from their profile menu.</li>
        </ul>
        <p>
          For account issues, email{" "}
          <span className="font-medium text-text-primary">
            support@soulschat.app
          </span>
          .
        </p>
      </div>
    </div>
  );
}
