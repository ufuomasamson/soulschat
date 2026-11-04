import { isValidFacebookPixelId } from "@/lib/advert/pixel";

/**
 * Official Meta Pixel base code rendered into the HTML (server component).
 * Ads Manager / Pixel Helper look for fbq('init', ...) in the page source —
 * client-only useEffect injection is not enough for Meta verification.
 */
export function MetaPixelSnippet({ pixelId }: { pixelId?: string | null }) {
  if (!isValidFacebookPixelId(pixelId)) return null;
  const id = pixelId as string;

  const inline = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
`.trim();

  return (
    <>
      {/* Meta Pixel Code */}
      <script dangerouslySetInnerHTML={{ __html: inline }} />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
    </>
  );
}
