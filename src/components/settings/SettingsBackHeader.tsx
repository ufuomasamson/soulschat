import { TopBar } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function SettingsBackHeader({
  title,
  backHref = "/settings",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <TopBar
      title={title}
      bordered
      className="bg-background pr-2 pl-1"
      left={
        <Link
          href={backHref}
          aria-label="Back"
          className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-text-primary hover:bg-background-secondary"
        >
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Link>
      }
    />
  );
}
