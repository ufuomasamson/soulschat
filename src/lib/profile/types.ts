import type { GenderValue, RelationshipValue } from "@/lib/auth/constants";

export const MAX_PROFILE_MEDIA = 6;

export interface ProfileMediaItem {
  id: string;
  user_id: string;
  url: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string;
  location: string;
  date_of_birth: string | null;
  gender: GenderValue | string | null;
  interests: string[];
  relationship_intention: RelationshipValue | string | null;
  online_status: boolean;
  last_seen: string | null;
  show_online_status: boolean;
  show_last_seen: boolean;
  allow_friend_requests: boolean;
  is_guest: boolean;
  facebook_pixel_id: string | null;
}
