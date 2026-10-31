import { DiscoverView } from "@/components/feed/DiscoverView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
};

export default function FeedPage() {
  return <DiscoverView />;
}
