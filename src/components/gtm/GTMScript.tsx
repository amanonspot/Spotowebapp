/**
 * GTMScript.tsx
 *
 * Renders the Google Tag Manager snippet for Next.js App Router.
 *
 * The GTM head script is loaded with strategy="afterInteractive" so it does
 * not block the page's critical rendering path. The <noscript> fallback is
 * rendered at the top of <body> for users with JavaScript disabled.
 *
 * Consent Mode v2: A consent-defaults script runs BEFORE GTM loads.
 * This sets analytics_storage=denied by default until the user explicitly
 * accepts via the CookieConsentBanner component.
 *
 * Usage: Add <GTMScript /> and <GTMNoScript /> to the root layout.
 */

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const CONSENT_DEFAULT_SCRIPT = `
(function(){
  var CONSENT_KEY='spoto_cookie_consent_v1';
  var stored=null;
  try { stored=window.localStorage.getItem(CONSENT_KEY); } catch(e){}
  var granted = stored==='accepted';
  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('consent','default',{
    analytics_storage: granted?'granted':'denied',
    ad_storage:'denied',
    functionality_storage:'granted',
    security_storage:'granted',
    wait_for_update: granted ? 0 : 500
  });
})();
`;

/** Consent defaults + GTM head script — place inside <head> or at root of layout */
export function GTMScript() {
    if (!GTM_ID) return null;

    return (
        <>
            {/* Consent Mode v2 defaults — must execute before GTM */}
            <Script
                id="gtm-consent-defaults"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }}
            />
            <Script
                id="gtm-script"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
(function(w,d,s,l,i){
  w[l]=w[l]||[];
  w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),
      dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;
  j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`,
                }}
            />
        </>
    );
}

/** GTM noscript iframe — place immediately after the opening <body> tag */
export function GTMNoScript() {
    if (!GTM_ID) return null;

    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
                title="gtm-noscript"
            />
        </noscript>
    );
}
