'use client';

import Link from 'next/link';
import { SignIn, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthSeite, clerkAppearance } from '@/components/auth/AuthSeite';
import { sichererPfad, signUpHref } from '@/lib/anmeldeLinks';

export function SignInSeite({ redirectUrl }: { redirectUrl: string | null }) {
  const ziel = sichererPfad(redirectUrl);
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Bereits angemeldet (z. B. zweiter Tab): direkt weiter. Die Middleware fängt den Normalfall schon serverseitig ab.
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(ziel || '/input-method');
  }, [isLoaded, isSignedIn, router, ziel]);

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
          fallbackRedirectUrl="/input-method"
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
