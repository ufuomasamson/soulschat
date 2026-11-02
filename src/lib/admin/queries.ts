import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminLinkRow,
  AdminReportRow,
  AdminStats,
  AdminUserRow,
  ReportStatus,
} from "./types";

type AnyClient = SupabaseClient;

export async function fetchIsAdmin(supabase: AnyClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, is_guest, is_disabled")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(
    data?.is_admin && !data?.is_guest && !data?.is_disabled,
  );
}

export async function fetchAdminStats(
  supabase: AnyClient,
): Promise<AdminStats> {
  const [
    users,
    guests,
    reportsOpen,
    activeLinks,
    conversations,
    messages,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_guest", false),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_guest", true),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    supabase
      .from("private_chat_links")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  for (const result of [
    users,
    guests,
    reportsOpen,
    activeLinks,
    conversations,
    messages,
  ]) {
    if (result.error) throw result.error;
  }

  return {
    users: users.count ?? 0,
    guests: guests.count ?? 0,
    reportsOpen: reportsOpen.count ?? 0,
    activeLinks: activeLinks.count ?? 0,
    conversations: conversations.count ?? 0,
    messages: messages.count ?? 0,
  };
}

export async function fetchAdminUsers(
  supabase: AnyClient,
  options?: { q?: string; limit?: number },
): Promise<AdminUserRow[]> {
  let query = supabase
    .from("profiles")
    .select(
      "id, name, email, avatar_url, is_guest, is_admin, is_disabled, online_status, created_at, location",
    )
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  const q = options?.q?.trim();
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,location.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Unknown"),
    email: (row.email as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    is_guest: Boolean(row.is_guest),
    is_admin: Boolean(row.is_admin),
    is_disabled: Boolean(row.is_disabled),
    online_status: Boolean(row.online_status),
    created_at: String(row.created_at),
    location: String(row.location ?? ""),
  }));
}

export async function fetchAdminReports(
  supabase: AnyClient,
): Promise<AdminReportRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      details,
      status,
      admin_notes,
      created_at,
      resolved_at,
      reporter:profiles!reports_reporter_id_fkey ( id, name, email ),
      reported:profiles!reports_reported_id_fkey ( id, name, email )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const reporter = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;
    const reported = Array.isArray(row.reported) ? row.reported[0] : row.reported;
    return {
      id: String(row.id),
      reason: String(row.reason ?? "other"),
      details: String(row.details ?? ""),
      status: (row.status as ReportStatus) ?? "open",
      admin_notes: String(row.admin_notes ?? ""),
      created_at: String(row.created_at),
      resolved_at: (row.resolved_at as string | null) ?? null,
      reporter: reporter
        ? {
            id: String(reporter.id),
            name: String(reporter.name ?? "Unknown"),
            email: (reporter.email as string | null) ?? null,
          }
        : null,
      reported: reported
        ? {
            id: String(reported.id),
            name: String(reported.name ?? "Unknown"),
            email: (reported.email as string | null) ?? null,
          }
        : null,
    };
  });
}

export async function fetchAdminLinks(
  supabase: AnyClient,
): Promise<AdminLinkRow[]> {
  const { data, error } = await supabase
    .from("private_chat_links")
    .select(
      `
      id,
      slug,
      is_active,
      visit_count,
      created_at,
      owner:profiles!private_chat_links_owner_id_fkey ( id, name, email )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const linkIds = (data ?? []).map((row) => String(row.id));
  const guestCounts = new Map<string, number>();

  if (linkIds.length) {
    const { data: guestRows, error: guestError } = await supabase
      .from("link_guest_chats")
      .select("link_id")
      .in("link_id", linkIds);
    if (guestError) throw guestError;
    for (const row of guestRows ?? []) {
      const id = String(row.link_id);
      guestCounts.set(id, (guestCounts.get(id) ?? 0) + 1);
    }
  }

  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      id: String(row.id),
      slug: String(row.slug),
      is_active: Boolean(row.is_active),
      visit_count: Number(row.visit_count ?? 0),
      created_at: String(row.created_at),
      owner: owner
        ? {
            id: String(owner.id),
            name: String(owner.name ?? "Unknown"),
            email: (owner.email as string | null) ?? null,
          }
        : null,
      guest_chats: guestCounts.get(String(row.id)) ?? 0,
    };
  });
}
