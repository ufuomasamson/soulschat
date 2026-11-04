"use client";

import { isValidFacebookPixelId } from "@/lib/advert/pixel";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Client-side event helper. Prefer MetaPixelSnippet on public landing pages so
 * Ads Manager can see the base code in HTML. Set skipPageView when the SSR
 * snippet already fired PageView.
 */
export function FacebookPixel({
  pixelId,
  event = "PageView",
  skipPageView = false,
}: {
  pixelId?: string | null;
  event?: "PageView" | "Lead" | "Contact" | "ViewContent";
  skipPageView?: boolean;
}) {
  useEffect(() => {
    if (!isValidFacebookPixelId(pixelId)) return;
    if (skipPageView && event === "PageView") return;
    if (!window.fbq) return;
    window.fbq("track", event);
  }, [pixelId, event, skipPageView]);

  return null;
}

export function trackFacebookEvent(
  event: "Lead" | "Contact" | "ViewContent" | "PageView",
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) {
    window.fbq("track", event, params);
  } else {
    window.fbq("track", event);
  }
}
