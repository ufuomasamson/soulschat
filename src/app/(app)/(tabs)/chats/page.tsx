import { ChatList } from "@/components/chat/ChatList";
import { TopBar } from "@/components/ui";
import type { Metadata } from "next";
import { ChatsHeaderActions } from "./ChatsHeaderActions";

export const metadata: Metadata = {
  title: "Chats",
};

export default function ChatsPage() {
  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Chats"
        right={<ChatsHeaderActions />}
        bordered={false}
        className="pr-2 pl-2"
      />
      <ChatList />
    </div>
  );
}
