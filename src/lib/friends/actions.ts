import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendRow } from "./types";

type AnyClient = SupabaseClient;

export async function sendFriendRequest(
  supabase: AnyClient,
  targetUserId: string,
) {
  const { data, error } = await supabase.rpc("send_friend_request", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
  return data as FriendRow;
}

export async function respondFriendRequest(
  supabase: AnyClient,
  requestId: string,
  accept: boolean,
) {
  const { data, error } = await supabase.rpc("respond_friend_request", {
    request_id: requestId,
    accept,
  });
  if (error) throw error;
  return data as FriendRow;
}

export async function removeFriend(
  supabase: AnyClient,
  targetUserId: string,
) {
  const { error } = await supabase.rpc("remove_friend", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
}
