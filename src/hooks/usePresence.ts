"use client";

import { setOnlineStatus } from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let stopped = false;

    async function goOnline() {
      if (stopped) return;
      try {
        await setOnlineStatus(supabase, userId!, true);
      } catch {
        // ignore transient presence errors
      }
    }

    async function goOffline() {
      try {
        await setOnlineStatus(supabase, userId!, false);
      } catch {
        // ignore
      }
    }

    void goOnline();
    const heartbeat = window.setInterval(() => {
      void goOnline();
    }, 45_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void goOnline();
      else void goOffline();
    };

    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", goOffline);

    return () => {
      stopped = true;
      window.clearInterval(heartbeat);
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", goOffline);
      void goOffline();
    };
  }, [userId]);
}
