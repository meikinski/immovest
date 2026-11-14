'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { hashNutzerId } from '@/lib/monitoring/datenschutz';

/** Fehlerberichte im Browser dem angemeldeten Nutzer zuordnen, nur über den Hash der Clerk-ID */
export function MonitoringNutzer() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      Sentry.setUser(null);
      return;
    }
    let aktiv = true;
    hashNutzerId(userId).then((id) => {
      if (aktiv) Sentry.setUser(id ? { id } : null);
    });
    return () => { aktiv = false; };
  }, [isLoaded, userId]);

  return null;
}
