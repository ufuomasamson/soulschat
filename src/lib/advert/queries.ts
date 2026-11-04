import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrivateChatLink, PrivateLinkPreview } from "./types";

type AnyClient = SupabaseClient;

export async function fetchActivePrivateChatLink(
  supabase: AnyClient,
  ownerId: string,
): Promise<PrivateChatLink | null> {
  const { data, error } = await supabase
    .from("private_chat_links")
    .select(
      "id, owner_id, slug, is_active, visit_count, created_at, updated_at",
    )
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as PrivateChatLink | null) ?? null;
}

/** Safe for ads crawlers / OG metadata — does not increment visit_count. */
export async function fetchPrivateLinkPreview(
  supabase: AnyClient,
  slug: string,
): Promise<PrivateLinkPreview | null> {
  const { data, error } = await supabase.rpc("get_private_link_preview", {
    link_slug: slug,
  });
  if (error) throw error;
  if (!data) return null;
  return data as PrivateLinkPreview;
}
