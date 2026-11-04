/** Extract a Meta Pixel ID from a numeric ID or the full Meta Pixel Code snippet. */
export function extractFacebookPixelId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const fromInit = raw.match(
    /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{5,20})['"]/i,
  );
  if (fromInit?.[1]) return fromInit[1];

  const fromNoscript = raw.match(/[?&]id=(\d{5,20})\b/i);
  if (fromNoscript?.[1]) return fromNoscript[1];

  const plain = raw.match(/^\d{5,20}$/);
  if (plain) return plain[0];

  const any = raw.match(/\b(\d{5,20})\b/);
  return any?.[1] ?? null;
}

export function isValidFacebookPixelId(value: string | null | undefined) {
  return Boolean(value && /^\d{5,20}$/.test(value));
}

/**
 * Load Meta Pixel, init the given ID, and fire PageView so Events Manager
 * can verify the connection.
 */
export async function connectAndVerifyFacebookPixel(
  pixelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidFacebookPixelId(pixelId)) {
    return { ok: false, error: "Enter a valid Meta Pixel ID or paste the full Pixel Code." };
  }

  if (typeof window === "undefined") {
    return { ok: false, error: "Pixel can only be verified in the browser." };
  }

  try {
    await ensureFacebookPixelScript();
    window.fbq?.("init", pixelId);
    window.fbq?.("track", "PageView");
    // Helps Events Manager show a fresh event after Connect.
    window.fbq?.("trackCustom", "SoulsChatPixelConnected", {
      source: "advert_settings",
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn't reach Facebook Pixel.",
    };
  }
}

function ensureFacebookPixelScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window"));
      return;
    }

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
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://connect.facebook.net/en_US/fbevents.js"]',
    );
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Facebook Pixel script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () =>
      reject(new Error("Failed to load Facebook Pixel script"));
    document.head.appendChild(script);
  });
}
