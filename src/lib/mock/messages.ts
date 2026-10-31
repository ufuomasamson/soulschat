export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  sender: "me" | "them";
  timestamp: string;
  status?: "sent" | "delivered" | "read";
}

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "m1",
      conversationId: "1",
      content: "Hey! How was your day?",
      sender: "them",
      timestamp: "10:38 PM",
    },
    {
      id: "m2",
      conversationId: "1",
      content: "Pretty good — just finished work. You?",
      sender: "me",
      timestamp: "10:40 PM",
      status: "read",
    },
    {
      id: "m3",
      conversationId: "1",
      content: "Hey, how are you?",
      sender: "them",
      timestamp: "10:42 PM",
    },
  ],
  "2": [
    {
      id: "m1",
      conversationId: "2",
      content: "We should try that new place downtown",
      sender: "me",
      timestamp: "9:15 PM",
      status: "delivered",
    },
    {
      id: "m2",
      conversationId: "2",
      content: "That sounds great 😂",
      sender: "them",
      timestamp: "9:21 PM",
    },
  ],
};

export function getMessages(conversationId: string): ChatMessage[] {
  return (
    MOCK_MESSAGES[conversationId] ?? [
      {
        id: "fallback",
        conversationId,
        content: "Say hello to start the conversation.",
        sender: "them",
        timestamp: "Now",
      },
    ]
  );
}
