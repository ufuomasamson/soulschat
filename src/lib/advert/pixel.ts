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

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Install the official Meta Pixel stub (queue before fbevents.js), init, and
 * fire PageView — same pattern Meta documents for manual installs.
 */
export async function connectAndVerifyFacebookPixel(
  pixelId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidFacebookPixelId(pixelId)) {
    return {
      ok: false,
      error: "Enter a valid Meta Pixel ID or paste the full Pixel Code.",
    };
  }

  if (typeof window === "undefined") {
    return { ok: false, error: "Pixel can only be verified in the browser." };
  }

  try {
    installOfficialPixelBootstrap(pixelId);
    // Give fbevents.js a moment to flush the queue to Meta.
    await wait(1200);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Couldn't reach Facebook Pixel.",
    };
  }
}

function installOfficialPixelBootstrap(pixelId: string) {
  const f = window;
  // Mirror Meta's snippet so init/track are queued even before the script loads.
  if (!f.fbq) {
    const n = function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    f.fbq = n;
    f._fbq = n;
  }

  const existing = document.querySelector(
    'script[src="https://connect.facebook.net/en_US/fbevents.js"]',
  );
  if (!existing) {
    const t = document.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    const s = document.getElementsByTagName("script")[0];
    s?.parentNode?.insertBefore(t, s);
  }

  f.fbq?.("init", pixelId);
  f.fbq?.("track", "PageView");
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
