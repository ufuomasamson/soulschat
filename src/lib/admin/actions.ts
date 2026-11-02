import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportStatus } from "./types";

type AnyClient = SupabaseClient;

export async function adminSetUserAdmin(
  supabase: AnyClient,
  targetUserId: string,
  makeAdmin: boolean,
) {
  const { error } = await supabase.rpc("admin_set_user_admin", {
    target_user_id: targetUserId,
    make_admin: makeAdmin,
  });
  if (error) throw error;
}

export async function adminSetUserDisabled(
  supabase: AnyClient,
  targetUserId: string,
  disabled: boolean,
) {
  const { error } = await supabase.rpc("admin_set_user_disabled", {
    target_user_id: targetUserId,
    disabled,
  });
  if (error) throw error;
}

export async function adminUpdateReport(
  supabase: AnyClient,
  reportId: string,
  status: ReportStatus,
  notes = "",
) {
  const { error } = await supabase.rpc("admin_update_report", {
    report_id: reportId,
    new_status: status,
    notes,
  });
  if (error) throw error;
}

export async function adminSetLinkActive(
  supabase: AnyClient,
  linkId: string,
  active: boolean,
) {
  const { error } = await supabase.rpc("admin_set_link_active", {
    link_id: linkId,
    active,
  });
  if (error) throw error;
}
