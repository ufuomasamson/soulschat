import { GuestLinkExperience } from "@/components/advert/GuestLinkExperience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private chat",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function PrivateChatLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GuestLinkExperience slug={slug} />;
}
