'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * Google Tag Manager Component with Cookie Consent
 *
 * Loads GTM script for tracking user behavior and conversions.
 * Only loads after user has given consent via cookie banner.
 * AI-Agent Ready: All events are automatically captured in GTM dataLayer
 */
export function GoogleTagManager() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check if user has given analytics consent
    const checkConsent = () => {
      const cookieConsent = localStorage.getItem('cookieConsent');
      if (cookieConsent) {
        const preferences = JSON.parse(cookieConsent);
        setHasConsent(preferences.analytics === true);
      }
    };

    checkConsent();

    // Listen for consent updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') {
        checkConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom consent event
    const handleConsentUpdate = () => {
      checkConsent();
    };
    window.addEventListener('cookieConsentUpdate', handleConsentUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cookieConsentUpdate', handleConsentUpdate);
    };
  }, []);

  // Don't load GTM if no ID is configured (development mode)
  if (!gtmId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GTM not loaded: NEXT_PUBLIC_GTM_ID not configured');
    }
    return null;
  }

  // Don't load GTM if user hasn't given consent
  if (!hasConsent) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 GTM not loaded: User has not given analytics consent');
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
