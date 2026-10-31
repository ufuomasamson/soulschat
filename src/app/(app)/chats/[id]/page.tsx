import { ConversationView } from "@/components/chat/ConversationView";
import type { Metadata } from "next";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: ConversationPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Chat",
    description: `Conversation ${id}`,
  };
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { id } = await params;
  return <ConversationView conversationId={id} />;
}
