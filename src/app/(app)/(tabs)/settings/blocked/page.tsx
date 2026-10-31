import { BlockedUsersView } from "@/components/settings/BlockedUsersView";
import { SettingsBackHeader } from "@/components/settings/SettingsBackHeader";
import { fetchBlockedUsers } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Blocked Users",
};

export const instant = false;

export default async function BlockedUsersPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const users = await fetchBlockedUsers(supabase, userId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SettingsBackHeader title="Blocked Users" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <BlockedUsersView users={users} />
      </div>
    </div>
  );
}
