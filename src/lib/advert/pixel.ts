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
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: Window["fbq"];
    __soulschatPixel?: {
      id: string;
      inited: boolean;
      scriptPromise?: Promise<void>;
    };
  }
}

function ensureFbqStub() {
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = n as any;
    fn.callMethod ? fn.callMethod(...args) : fn.queue.push(args);
  } as NonNullable<Window["fbq"]>;
  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  n.push = n;
  window.fbq = n;
  window._fbq = n;
}

function loadFbeventsScript(): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-soulschat-fbevents="1"]',
  );
  if (existing?.dataset.loaded === "1") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          existing.dataset.loaded = "1";
          resolve();
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load fbevents.js")),
        { once: true },
      );
      // Already cached/complete without load event.
      window.setTimeout(() => {
        existing.dataset.loaded = "1";
        resolve();
      }, 1200);
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.soulschatFbevents = "1";
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load fbevents.js"));
    document.head.appendChild(script);
  });
}

/**
 * Install Meta Pixel via createElement (runs even when Next streamed inline
 * scripts do not execute). Safe to call repeatedly.
 */
export async function ensureMetaPixel(
  pixelId: string,
  advancedMatching?: Record<string, string>,
): Promise<void> {
  if (!isValidFacebookPixelId(pixelId)) {
    throw new Error("Invalid Pixel ID");
  }
  if (typeof window === "undefined") {
    throw new Error("No window");
  }

  ensureFbqStub();

  const prev = window.__soulschatPixel;
  if (!prev || prev.id !== pixelId) {
    window.__soulschatPixel = {
      id: pixelId,
      inited: false,
      scriptPromise: loadFbeventsScript(),
    };
  } else if (!prev.scriptPromise) {
    prev.scriptPromise = loadFbeventsScript();
  }

  await window.__soulschatPixel!.scriptPromise;

  if (!window.__soulschatPixel!.inited || advancedMatching) {
    if (advancedMatching) {
      window.fbq?.("init", pixelId, advancedMatching);
    } else {
      window.fbq?.("init", pixelId);
    }
    window.__soulschatPixel!.inited = true;
  }
}

export async function trackMetaEvent(
  pixelId: string | null | undefined,
  event: "PageView" | "Lead" | "Contact" | "ViewContent",
  params?: Record<string, unknown>,
  advancedMatching?: Record<string, string>,
) {
  if (!isValidFacebookPixelId(pixelId)) return false;
  try {
    await ensureMetaPixel(pixelId!, advancedMatching);
    if (params) {
      window.fbq?.("track", event, params);
    } else {
      window.fbq?.("track", event);
    }
    return true;
  } catch {
    return false;
  }
}

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
    const ok = await trackMetaEvent(pixelId, "PageView");
    if (!ok) return { ok: false, error: "Couldn't reach Facebook Pixel." };
    await new Promise((r) => window.setTimeout(r, 800));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Couldn't reach Facebook Pixel.",
    };
  }
}
