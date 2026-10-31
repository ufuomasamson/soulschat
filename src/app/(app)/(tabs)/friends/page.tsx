import { FriendsView } from "@/components/friends/FriendsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends",
};

export default function FriendsPage() {
  return <FriendsView />;
}
