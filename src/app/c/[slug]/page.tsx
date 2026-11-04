import { GuestLinkExperience } from "@/components/advert/GuestLinkExperience";
import { MetaPixelSnippet } from "@/components/advert/MetaPixelSnippet";
import { fetchPrivateLinkPreview } from "@/lib/advert/queries";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const instant = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveSiteOrigin() {
  const env =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "";
}

function toAbsolute(origin: string, pathOrUrl: string) {
  if (!pathOrUrl) return origin || "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!origin) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const origin = await resolveSiteOrigin();
  const supabase = await createClient();

  let preview = null;
  try {
    preview = await fetchPrivateLinkPreview(supabase, slug);
  } catch {
    preview = null;
  }

  const url = toAbsolute(origin, `/c/${slug}`);
  const title = preview?.name
    ? `Chat with ${preview.name} on SoulsChat`
    : "Private chat · SoulsChat";
  const description =
    preview?.bio?.trim() ||
    (preview?.name
      ? `Start a private conversation with ${preview.name} on SoulsChat.`
      : "Start a private conversation on SoulsChat.");
  const image = toAbsolute(
    origin,
    preview?.cover_url || preview?.avatar_url || "/img/souls-icon.png",
  );

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "SoulsChat",
      images: [
        {
          url: image,
          alt: preview?.name ? `${preview.name} on SoulsChat` : "SoulsChat",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    ...(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      ? {
          other: {
            "fb:app_id": process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          },
        }
      : {}),
  };
}

export default async function PrivateChatLinkPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  let preview = null;
  try {
    preview = await fetchPrivateLinkPreview(supabase, slug);
  } catch {
    preview = null;
  }

  return (
    <>
      <MetaPixelSnippet pixelId={preview?.facebook_pixel_id} />
      <GuestLinkExperience slug={slug} />
    </>
  );
}
