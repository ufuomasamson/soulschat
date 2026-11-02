export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface AdminStats {
  users: number;
  guests: number;
  reportsOpen: number;
  activeLinks: number;
  conversations: number;
  messages: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  is_admin: boolean;
  is_disabled: boolean;
  online_status: boolean;
  created_at: string;
  location: string;
}

export interface AdminReportRow {
  id: string;
  reason: string;
  details: string;
  status: ReportStatus;
  admin_notes: string;
  created_at: string;
  resolved_at: string | null;
  reporter: { id: string; name: string; email: string | null } | null;
  reported: { id: string; name: string; email: string | null } | null;
}

export interface AdminLinkRow {
  id: string;
  slug: string;
  is_active: boolean;
  visit_count: number;
  created_at: string;
  owner: { id: string; name: string; email: string | null } | null;
  guest_chats: number;
}
