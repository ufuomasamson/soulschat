"use client";

import { isValidFacebookPixelId } from "@/lib/advert/pixel";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function FacebookPixel({
  pixelId,
  event,
}: {
  pixelId?: string | null;
  event?: "PageView" | "Lead" | "Contact" | "ViewContent";
}) {
  useEffect(() => {
    if (!isValidFacebookPixelId(pixelId)) return;
    const id = pixelId as string;

    if (!window.fbq) {
      const n = function (...args: unknown[]) {
        // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
        const fn = n as any;
        fn.callMethod ? fn.callMethod(...args) : fn.queue.push(args);
      } as ((...args: unknown[]) => void) & {
        callMethod?: (...args: unknown[]) => void;
        queue: unknown[];
        loaded: boolean;
        version: string;
        push: (...args: unknown[]) => void;
      };

      n.queue = [];
      n.loaded = true;
      n.version = "2.0";
      n.push = n;
      window.fbq = n;
      window._fbq = n;

      const existing = document.querySelector(
        'script[src="https://connect.facebook.net/en_US/fbevents.js"]',
      );
      if (!existing) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);
      }

      window.fbq("init", id);
    }

    window.fbq?.("track", event ?? "PageView");
  }, [pixelId, event]);

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
