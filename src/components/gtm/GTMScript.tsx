/**
 * GTMScript.tsx
 *
 * Consent Mode v2 defaults are set to 'granted' for all storage types.
 * India mein abhi GDPR jaisa strict law nahi hai, isliye consent banner
 * nahi hai aur tracking by default enabled hai.
 */

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const CONSENT_DEFAULT_SCRIPT = `
(function(){
  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('consent','default',{
    analytics_storage:'granted',
    ad_storage:'granted',
    functionality_storage:'granted',
    security_storage:'granted'
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
