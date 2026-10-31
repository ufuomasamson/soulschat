import { AppShell } from "@/components/layout/AppShell";
import { ReactNode } from "react";

export default function UserProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell showNav={false}>{children}</AppShell>;
}
