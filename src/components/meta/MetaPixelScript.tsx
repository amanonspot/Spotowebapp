import Script from 'next/script';
import { PIXEL_ID } from '@/lib/analytics/metaPixel';

/**
 * Injects the Meta Pixel base script.
 * Consent is granted by default — no banner needed for India.
 */

const PIXEL_INIT_SCRIPT = (pixelId: string) => `
(function(){
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('consent', 'grant');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
})();
`;

export function MetaPixelScript() {
    if (!PIXEL_ID) return null;

    return (
        <>
            <Script
                id="meta-pixel-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: PIXEL_INIT_SCRIPT(PIXEL_ID) }}
            />
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    height="1"
                    width="1"
                    style={{ display: 'none' }}
                    src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>
        </>
    );
}
