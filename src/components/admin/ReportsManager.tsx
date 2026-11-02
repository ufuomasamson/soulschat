"use client";

import { Button, useToast } from "@/components/ui";
import { adminUpdateReport } from "@/lib/admin/actions";
import type { AdminReportRow, ReportStatus } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

const STATUSES: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

export function ReportsManager({
  initialReports,
}: {
  initialReports: AdminReportRow[];
}) {
  const { toast } = useToast();
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(report: AdminReportRow, status: ReportStatus) {
    setBusyId(report.id);
    const supabase = createClient();
    try {
      await adminUpdateReport(supabase, report.id, status, report.admin_notes);
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status,
                resolved_at:
                  status === "resolved" || status === "dismissed"
                    ? new Date().toISOString()
                    : null,
              }
            : r,
        ),
      );
      toast({ title: "Report updated", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update report",
        description: err instanceof Error ? err.message : "Try again.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li
          key={report.id}
          className="rounded-[var(--radius-2xl)] border border-border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">
                {report.reported?.name ?? "Unknown"} reported
              </p>
              <p className="mt-0.5 text-[13px] text-text-secondary">
                by {report.reporter?.name ?? "Unknown"} · {report.reason}
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>
          {report.details ? (
            <p className="mt-3 text-[14px] text-text-secondary">{report.details}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={report.status === status ? "primary" : "outline"}
                disabled={busyId === report.id}
                loading={busyId === report.id && report.status !== status}
                onClick={() => void setStatus(report, status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </li>
      ))}
      {reports.length === 0 ? (
        <li className="rounded-[var(--radius-2xl)] border border-border p-8 text-center text-[14px] text-text-secondary">
          No reports yet.
        </li>
      ) : null}
    </ul>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
        status === "open" && "bg-error/10 text-error",
        status === "reviewing" && "bg-primary-light text-primary",
        status === "resolved" && "bg-success/10 text-success",
        status === "dismissed" && "bg-background-secondary text-text-secondary",
      )}
    >
      {status}
    </span>
  );
}
