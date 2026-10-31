import { AppShell } from "@/components/layout/AppShell";
import { Suspense } from "react";

function TabsShellFallback() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[var(--desktop-max-width)] bg-background-secondary">
      <div className="relative mx-auto flex h-full w-full max-w-[var(--app-max-width)] flex-col bg-background md:mx-0 md:max-w-none md:flex-1 md:border-x md:border-border" />
    </div>
  );
}

export default function TabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<TabsShellFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
