export interface PrivateChatLink {
  id: string;
  owner_id: string;
  slug: string;
  is_active: boolean;
  visit_count: number;
  created_at: string;
  updated_at: string;
}

export interface PrivateLinkLandingOwner {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  date_of_birth: string | null;
  gender: string | null;
  interests: string[];
  relationship_intention: string | null;
  online_status: boolean;
  last_seen: string | null;
  show_online_status: boolean;
  show_last_seen: boolean;
  facebook_pixel_id: string | null;
}

export interface PrivateLinkLandingMedia {
  id: string;
  url: string;
  sort_order: number;
}

export interface PrivateLinkLanding {
  link: {
    id: string;
    slug: string;
    owner_id: string;
  };
  owner: PrivateLinkLandingOwner;
  media: PrivateLinkLandingMedia[];
}

export interface PrivateLinkChatResult {
  conversation_id: string;
  owner_id: string;
  guest_user_id: string;
}

export interface LinkGuestSummary {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  show_on_feed: boolean;
  conversation_id: string;
  created_at?: string;
  is_link_guest?: boolean;
}

export function privateChatLinkUrl(slug: string, origin?: string) {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/c/${slug}`;
}
