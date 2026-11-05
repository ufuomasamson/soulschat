import { UsersManager } from "@/components/admin/UsersManager";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { fetchAdminUsers } from "@/lib/admin/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Users",
};

export const instant = false;

export default async function AdminUsersPage() {
  const { supabase, userId } = await requireAdmin();
  const users = await fetchAdminUsers(supabase);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-[22px] font-semibold text-text-primary">Users</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Search members and guests, grant admin access, disable accounts, or
          delete users individually or in bulk.
        </p>
      </div>
      <UsersManager initialUsers={users} currentUserId={userId} />
    </div>
  );
}
