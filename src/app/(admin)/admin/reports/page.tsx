import { ReportsManager } from "@/components/admin/ReportsManager";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { fetchAdminReports } from "@/lib/admin/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Reports",
};

export const instant = false;

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin();
  const reports = await fetchAdminReports(supabase);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-[22px] font-semibold text-text-primary">Reports</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Review safety reports and update their status.
        </p>
      </div>
      <ReportsManager initialReports={reports} />
    </div>
  );
}
