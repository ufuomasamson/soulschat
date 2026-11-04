"use client";

import { trackMetaEvent } from "@/lib/advert/pixel";

/**
 * Fire Meta standard events. Always pass the owner's pixelId so we can install
 * the pixel if the page snippet did not execute.
 */
export async function trackFacebookEvent(
  event: "Lead" | "Contact" | "ViewContent" | "PageView",
  params?: Record<string, unknown>,
  pixelId?: string | null,
  advancedMatching?: Record<string, string>,
) {
  const id =
    pixelId ||
    (typeof window !== "undefined" ? window.__soulschatPixel?.id : null);
  return trackMetaEvent(id, event, params, advancedMatching);
}
