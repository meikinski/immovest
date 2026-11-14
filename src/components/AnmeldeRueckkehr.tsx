'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { hatGastWohnung, stelleGastWohnungWiederHer, vergissGastWohnung } from '@/lib/anmeldeRueckkehr';

/**
 * Nach jeder Anmeldung oder Registrierung (Google, E-Mail, gesperrte Vorschau, Kopfzeile):
 * Hat der Gast in den letzten 24 Stunden eine Wohnung eingegeben, wird sie wiederhergestellt und das
 * Ergebnis geöffnet. Egal, wohin Clerk danach leitet (z. B. /input-method, das den Autosave leert).
 * Die Ergebnis-Seite holt die gesicherte Wohnung selbst ab und startet bei Bedarf die vollständige Analyse.
 */
export function AnmeldeRueckkehr() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname() || '';
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // Clerk-Unterschritte (sso-callback, verify-email) und die Ergebnis-Seite selbst nicht stören
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/step/tabs') return;
    if (!hatGastWohnung()) return;
    if (!stelleGastWohnungWiederHer()) {
      // Eine andere Analyse ist offen: die bleibt, die alte Gast-Wohnung wird verworfen
      vergissGastWohnung();
      return;
    }
    router.replace('/step/tabs');
  }, [isLoaded, isSignedIn, pathname, router]);

  return null;
}
