"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-2xl)] border border-border px-4 py-3.5",
        "text-left text-[15px] font-medium text-error",
        "transition-colors duration-150 hover:bg-primary-light/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      <LogOut className="size-[20px]" strokeWidth={1.75} />
      {loading ? "Signing out..." : "Log Out"}
    </button>
  );
}
