import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LinkGuestSummary,
  PrivateChatLink,
  PrivateLinkChatResult,
  PrivateLinkLanding,
} from "./types";

type AnyClient = SupabaseClient;

const GUEST_CRED_PREFIX = "soulschat.guest.";

export async function saveFacebookPixel(
  supabase: AnyClient,
  pixelId: string,
) {
  const { data, error } = await supabase.rpc("update_facebook_pixel", {
    pixel_id: pixelId,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function createOrGetPrivateChatLink(supabase: AnyClient) {
  const { data, error } = await supabase.rpc("create_or_get_private_chat_link");
  if (error) throw error;
  return data as PrivateChatLink;
}

export async function regeneratePrivateChatLink(supabase: AnyClient) {
  const { data, error } = await supabase.rpc("regenerate_private_chat_link");
  if (error) throw error;
  return data as PrivateChatLink;
}

export async function fetchPrivateLinkLanding(
  supabase: AnyClient,
  slug: string,
): Promise<PrivateLinkLanding | null> {
  const { data, error } = await supabase.rpc("get_private_link_landing", {
    link_slug: slug,
  });
  if (error) throw error;
  if (!data) return null;
  return data as PrivateLinkLanding;
}

export async function ensureGuestSession(
  supabase: AnyClient,
  slug: string,
  name: string,
  contactEmail: string,
): Promise<{ userId: string }> {
  const cleaned = name.trim();
  const cleanedEmail = contactEmail.trim().toLowerCase();
  if (cleaned.length < 2) {
    throw new Error("Please enter your name");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
    throw new Error("Please enter a valid email");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const metaGuest = user.user_metadata?.is_guest === true;
    const emailGuest = (user.email || "").endsWith("@guests.soulschat.local");
    if (metaGuest || emailGuest) {
      await supabase
        .from("profiles")
        .update({
          name: cleaned,
          email: cleanedEmail,
          is_guest: true,
          show_on_feed: false,
        })
        .eq("id", user.id);
      return { userId: user.id };
    }
    // Existing SoulsChat member — keep session, just chat as themselves
    return { userId: user.id };
  }

  const stored = readGuestCredentials(slug);
  if (stored) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: stored.email,
      password: stored.password,
    });
    if (!error && data.user) {
      await supabase
        .from("profiles")
        .update({
          name: cleaned,
          email: cleanedEmail,
          is_guest: true,
          show_on_feed: false,
        })
        .eq("id", data.user.id);
      writeGuestCredentials(slug, {
        email: stored.email,
        password: stored.password,
        name: cleaned,
        contactEmail: cleanedEmail,
      });
      return { userId: data.user.id };
    }
  }

  const id = crypto.randomUUID().replace(/-/g, "");
  const email = `guest.${id}@guests.soulschat.local`;
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: cleaned,
        is_guest: true,
        contact_email: cleanedEmail,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("Couldn't create guest session");

  // If confirmation somehow blocked session, sign in explicitly
  if (!data.session) {
    const signedIn = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signedIn.error || !signedIn.data.user) {
      throw signedIn.error ?? new Error("Couldn't start guest session");
    }
  }

  await supabase
    .from("profiles")
    .update({
      name: cleaned,
      email: cleanedEmail,
      is_guest: true,
      show_on_feed: false,
    })
    .eq("id", data.user.id);

  writeGuestCredentials(slug, {
    email,
    password,
    name: cleaned,
    contactEmail: cleanedEmail,
  });
  return { userId: data.user.id };
}

export async function startPrivateLinkChat(
  supabase: AnyClient,
  slug: string,
  guestName: string,
  guestEmail?: string | null,
): Promise<PrivateLinkChatResult> {
  const { data, error } = await supabase.rpc("start_private_link_chat", {
    link_slug: slug,
    guest_display_name: guestName,
    guest_contact_email: guestEmail?.trim() || null,
  });
  if (error) throw error;
  return data as PrivateLinkChatResult;
}

export async function listMyLinkGuests(supabase: AnyClient) {
  const { data, error } = await supabase.rpc("list_my_link_guests");
  if (error) throw error;
  return (data as LinkGuestSummary[] | null) ?? [];
}

export async function getOwnedLinkGuest(
  supabase: AnyClient,
  guestUserId: string,
) {
  const { data, error } = await supabase.rpc("get_owned_link_guest", {
    target_guest_id: guestUserId,
  });
  if (error) throw error;
  return (data as LinkGuestSummary | null) ?? null;
}

export async function setLinkGuestFeedVisibility(
  supabase: AnyClient,
  guestUserId: string,
  visible: boolean,
) {
  const { data, error } = await supabase.rpc("set_link_guest_feed_visibility", {
    target_guest_id: guestUserId,
    visible,
  });
  if (error) throw error;
  return data as { guest_user_id: string; show_on_feed: boolean };
}

function readGuestCredentials(slug: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${GUEST_CRED_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      email?: string;
      password?: string;
      name?: string;
      contactEmail?: string;
    };
    if (!parsed.email || !parsed.password) return null;
    return {
      email: parsed.email,
      password: parsed.password,
      name: parsed.name || "",
      contactEmail: parsed.contactEmail || "",
    };
  } catch {
    return null;
  }
}

function writeGuestCredentials(
  slug: string,
  creds: {
    email: string;
    password: string;
    name: string;
    contactEmail: string;
  },
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${GUEST_CRED_PREFIX}${slug}`,
    JSON.stringify(creds),
  );
}

export function readStoredGuestName(slug: string) {
  return readGuestCredentials(slug)?.name ?? "";
}

export function readStoredGuestEmail(slug: string) {
  return readGuestCredentials(slug)?.contactEmail ?? "";
}
