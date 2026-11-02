import { StatCards } from "@/components/admin/StatCards";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { fetchAdminStats } from "@/lib/admin/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
};

export const instant = false;

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const stats = await fetchAdminStats(supabase);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-[22px] font-semibold text-text-primary">Overview</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Monitor users, reports, advert links, and platform activity.
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/admin/users" title="Manage users" body="Promote admins or disable accounts." />
        <QuickLink href="/admin/reports" title="Review reports" body="Triage spam, harassment, and safety flags." />
        <QuickLink href="/admin/links" title="Advert links" body="Activate or shut down private chat links." />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-2xl)] border border-border p-4 transition-colors hover:bg-background-secondary"
    >
      <p className="text-[15px] font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-[13px] text-text-secondary">{body}</p>
    </Link>
  );
}
