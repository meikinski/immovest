'use client';

import Link from 'next/link';
import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { AuthSeite, clerkAppearance } from '@/components/auth/AuthSeite';
import { sichererPfad, signUpHref } from '@/lib/anmeldeLinks';
import { anmeldeZiel, keinAbo } from '@/lib/anmeldeRueckkehr';

export function SignInSeite({ redirectUrl }: { redirectUrl: string | null }) {
  const ziel = sichererPfad(redirectUrl);
  // Ohne Rücksprung: zur zuletzt eingegebenen Wohnung (24 h), sonst zur Eingabe
  const fallback = useSyncExternalStore(keinAbo, anmeldeZiel, () => '/input-method');
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Bereits angemeldet (z. B. zweiter Tab): direkt weiter. Die Middleware fängt den Normalfall schon serverseitig ab.
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(ziel || fallback);
  }, [isLoaded, isSignedIn, router, ziel, fallback]);

  return (
    <AuthSeite
      titel="Willkommen zurück"
      untertitel="Melde dich an, um deine Analysen zu öffnen."
      formular={
        <SignIn
          routing="path"
          path="/sign-in"
          appearance={clerkAppearance}
          signUpUrl={signUpHref('sign_in_page', ziel)}
          fallbackRedirectUrl={fallback}
        />
      }
      wechsel={
        <>
          Neu hier?{' '}
          <Link href={signUpHref('sign_in_page', ziel)} className="font-bold text-[#ff6b00] hover:underline">
            Kostenlos registrieren
          </Link>
        </>
      }
    />
  );
}
