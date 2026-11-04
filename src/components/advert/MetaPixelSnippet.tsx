"use client";

import { isValidFacebookPixelId, trackMetaEvent } from "@/lib/advert/pixel";
import { useEffect, useRef } from "react";

/**
 * Client-side Meta Pixel installer. Next.js streamed inline <script> tags are
 * often present in HTML (Pixel Helper "finds" them) but never execute, so no
 * events are sent. This component installs via createElement + fbq.track.
 */
export function MetaPixelSnippet({ pixelId }: { pixelId?: string | null }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!isValidFacebookPixelId(pixelId) || fired.current) return;
    fired.current = true;
    void trackMetaEvent(pixelId, "PageView");
  }, [pixelId]);

  if (!isValidFacebookPixelId(pixelId)) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
