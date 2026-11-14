'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

/**
 * sign_up (GA4) und ads_conversion_signup (Google Ads) einmal je neu angelegtem Konto.
 * Neu heißt: Konto vor weniger als 5 Minuten erstellt (Zeit für E-Mail-Bestätigung und Weiterleitungen).
 * Ein Login in ein bestehendes Konto löst nichts aus. Keine User-ID oder E-Mail im Event.
 */
export function SignupTracker() {
  const { user, isLoaded } = useUser();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || hasTracked.current) return;
    hasTracked.current = true;

    // Schlüssel nur lokal im Browser, wird nicht gesendet
    const trackingKey = `ads_conversion_tracked_${user.id}`;
    try { if (localStorage.getItem(trackingKey)) return; } catch { /* privater Modus */ }

    if (!user.createdAt) return;
    const sekundenSeitAnlage = (Date.now() - new Date(user.createdAt).getTime()) / 1000;
    if (sekundenSeitAnlage >= 300) return;

    trackEvent(AnalyticsEvents.ADS_CONVERSION_SIGNUP);
    trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);
    // method: google, apple, … oder email
    trackEvent(AnalyticsEvents.SIGN_UP, {
      method: user.externalAccounts?.[0]?.provider?.replace(/^oauth_/, '') || 'email',
    });

    try { localStorage.setItem(trackingKey, 'true'); } catch { /* privater Modus */ }
  }, [user, isLoaded]);

  return null;
}
