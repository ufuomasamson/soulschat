import type { AdminStats } from "@/lib/admin/types";

export function StatCards({ stats }: { stats: AdminStats }) {
  const items = [
    { label: "Members", value: stats.users },
    { label: "Guests", value: stats.guests },
    { label: "Open reports", value: stats.reportsOpen },
    { label: "Active ad links", value: stats.activeLinks },
    { label: "Conversations", value: stats.conversations },
    { label: "Messages", value: stats.messages },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-2xl)] border border-border bg-background p-4"
        >
          <p className="text-[12px] text-text-secondary">{item.label}</p>
          <p className="mt-1 text-[24px] font-semibold tabular-nums text-text-primary">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
