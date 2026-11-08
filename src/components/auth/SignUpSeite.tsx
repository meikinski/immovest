'use client';

import Link from 'next/link';
import { SignUp, useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { AuthSeite, clerkAppearance } from '@/components/auth/AuthSeite';
import { fuehrtZurAnalyse, sichererPfad, signInHref } from '@/lib/anmeldeLinks';
import { leseWohnungFuerAnmeldung } from '@/lib/anmeldeRueckkehr';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';

const VORTEILE = ['KI-Einschätzung, Markt & Prognose', 'Szenarien und PDF-Report inklusive', 'Ohne Kreditkarte, kein Abo'];

const euro = (n: number) => `${Math.round(n).toLocaleString('de-DE')} €`;

// Wohnung aus dem Browser-Speicher als einzeilige Zeichenkette (stabiler Snapshot, auf dem Server leer)
const keinAbo = () => () => {};
const wohnungZeile = () => {
  const w = leseWohnungFuerAnmeldung();
  return w ? `${w.titel}\t${euro(w.kaufpreis)}` : '';
};

export function SignUpSeite({ source, redirectUrl }: { source: string | null; redirectUrl: string | null }) {
  const ziel = sichererPfad(redirectUrl);
  // Kommt jemand mit einer eingegebenen Wohnung (Ergebnis, gesperrte Vorschau, Paywall), steht das schon in der URL fest
  const mitWohnung = fuehrtZurAnalyse(ziel);
  const [wohnungTitel, wohnungPreis] = useSyncExternalStore(keinAbo, wohnungZeile, () => '').split('\t');

  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const getrackt = useRef(false);

  // Nur die Einstiegsseite zählen, nicht Clerks Unterschritte (/sign-up/verify-email-address, …)
  useEffect(() => {
    if (getrackt.current || pathname !== '/sign-up') return;
    getrackt.current = true;
    trackEvent(AnalyticsEvents.SIGN_UP_PAGE_VIEWED, { source: source || 'direct', has_property: mitWohnung });
  }, [pathname, source, mitWohnung]);

  // Bereits angemeldet (z. B. zweiter Tab): direkt weiter. Die Middleware fängt den Normalfall schon serverseitig ab.
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(ziel || '/input-method');
  }, [isLoaded, isSignedIn, router, ziel]);

  return (
    <AuthSeite
      titel={mitWohnung ? 'Fast geschafft: Deine Analyse ist gleich fertig' : 'Erste Wohnung kostenlos analysieren'}
      untertitel={
        mitWohnung ? (
          // Höhe reserviert, damit das Formular nicht springt, wenn die Wohnung aus dem Speicher kommt
          <p className="flex min-h-5 justify-center gap-1 font-semibold text-[#001d3d]" title={wohnungTitel || undefined}>
            <span className="truncate">{wohnungTitel || '\u00a0'}</span>
            {wohnungPreis && <span className="shrink-0">· {wohnungPreis}</span>}
          </p>
        ) : undefined
      }
      formular={
        <SignUp
          routing="path"
          path="/sign-up"
          appearance={clerkAppearance}
          signInUrl={signInHref(ziel)}
          fallbackRedirectUrl="/input-method"
        />
      }
      wechsel={
        <>
          Schon ein Konto?{' '}
          <Link href={signInHref(ziel)} className="font-bold text-[#ff6b00] hover:underline">
            Anmelden
          </Link>
        </>
      }
    >
      <ul className="mt-5 flex flex-col gap-1.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
        {VORTEILE.map((v) => (
          <li key={v} className="flex items-center gap-2">
            <Check size={16} strokeWidth={2.6} className="shrink-0 text-emerald-500" />
            {v}
          </li>
        ))}
      </ul>
    </AuthSeite>
  );
}
