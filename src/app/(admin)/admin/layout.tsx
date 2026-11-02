import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
