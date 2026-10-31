import { SquarePen } from "lucide-react";
import Link from "next/link";

export function ChatsHeaderActions() {
  return (
    <Link
      href="/chats/new"
      aria-label="New chat"
      className="inline-flex size-10 items-center justify-center rounded-[var(--radius-lg)] text-primary transition-colors hover:bg-primary-light"
    >
      <SquarePen className="size-5" strokeWidth={1.75} />
    </Link>
  );
}
