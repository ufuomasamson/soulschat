export interface ConversationPreview {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online?: boolean;
  muted?: boolean;
}

export const MOCK_CONVERSATIONS: ConversationPreview[] = [
  {
    id: "1",
    name: "Sarah Okonkwo",
    lastMessage: "Hey, how are you?",
    timestamp: "10:42 PM",
    unreadCount: 2,
    online: true,
  },
  {
    id: "2",
    name: "David Chen",
    lastMessage: "That sounds great 😂",
    timestamp: "9:21 PM",
    unreadCount: 0,
    online: true,
  },
  {
    id: "3",
    name: "Grace Adeyemi",
    lastMessage: "See you tomorrow",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
  {
    id: "4",
    name: "Michael Torres",
    lastMessage: "I'll send the photos tonight",
    timestamp: "Yesterday",
    unreadCount: 1,
  },
  {
    id: "5",
    name: "Amara Nwosu",
    lastMessage: "Coffee this weekend?",
    timestamp: "Wed",
    unreadCount: 0,
    online: true,
  },
  {
    id: "6",
    name: "James Whitfield",
    lastMessage: "Thanks for the recommendation!",
    timestamp: "Tue",
    unreadCount: 0,
  },
  {
    id: "7",
    name: "Priya Sharma",
    lastMessage: "You: Looking forward to it",
    timestamp: "Mon",
    unreadCount: 0,
  },
  {
    id: "8",
    name: "Noah Mensah",
    lastMessage: "Just landed. Talk soon.",
    timestamp: "Sun",
    unreadCount: 0,
  },
];
