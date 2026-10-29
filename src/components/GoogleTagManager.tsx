'use client';

import Script from 'next/script';
import { INTERN_KEY } from '@/lib/analytics';

/**
 * Google Tag Manager Component
 *
 * Loads GTM script for tracking user behavior and conversions.
 * AI-Agent Ready: All events are automatically captured in GTM dataLayer
 */
export function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // Don't load GTM if no ID is configured (development mode)
  if (!gtmId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GTM not loaded: NEXT_PUBLIC_GTM_ID not configured');
    }
    return null;
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Interner Traffic vor dem ersten page_view markieren (?intern=1 / ?intern=0, siehe lib/analytics.ts)
            try {
              var p = new URLSearchParams(location.search).get('intern');
              if (p === '1') localStorage.setItem('${INTERN_KEY}', '1');
              if (p === '0') localStorage.removeItem('${INTERN_KEY}');
              if (localStorage.getItem('${INTERN_KEY}') === '1') {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({ traffic_type: 'internal' });
              }
            } catch (e) {}
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />

      {/* Google Tag Manager noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}
