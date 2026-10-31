import type { ProfileSummary } from "@/lib/chat/types";

export type FriendStatus = "pending" | "accepted" | "declined" | "blocked";

export type FriendshipRelation =
  | "none"
  | "friends"
  | "outgoing_request"
  | "incoming_request"
  | "declined"
  | "blocked";

export interface FriendRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendStatus;
  created_at: string;
}

export interface FriendListItem {
  friendshipId: string;
  profile: ProfileSummary;
  since: string;
}

export interface FriendRequestItem {
  friendshipId: string;
  profile: ProfileSummary;
  created_at: string;
  direction: "incoming" | "outgoing";
}
