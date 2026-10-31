import { NewChatView } from "@/components/chat/NewChatView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New chat",
};

export default function NewChatPage() {
  return <NewChatView />;
}
