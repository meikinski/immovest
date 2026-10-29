'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { istInternerTraffic, setzeInternenTraffic } from '@/lib/analytics';

/**
 * Testkonten: Clerk publicMetadata { "internal": true } markiert das Gerät als internen Traffic,
 * damit GA4 die Events per Datenfilter ausschließt (siehe GOOGLE_ANALYTICS_SETUP.md).
 */
export function InternerTrafficTracker() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (user.publicMetadata?.internal === true && !istInternerTraffic()) {
      setzeInternenTraffic(true);
    }
  }, [user, isLoaded]);

  return null;
}
