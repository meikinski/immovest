'use client';

import { SignUp, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { GRATIS_VORTEILE } from "@/components/GratisVorteile";
import { GRATIS_ANALYSEN } from "@/lib/preise";

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/input-method');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show nothing while checking auth or if already signed in
  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--brand))]/5 via-white to-[hsl(var(--brand-2))]/5">
      {/* Header */}
      <div className="px-5 py-4 md:px-6 md:py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 md:h-12 md:w-12">
            <Image
              src="/logo.png"
              alt="ImVestr Logo"
              width={48}
              height={48}
              className="h-full w-full rounded-lg"
              priority
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter">
            imvestr
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-5 pb-12 pt-2 md:px-6 md:py-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="mb-5 text-center md:mb-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900 md:mb-2 md:text-3xl">
              Jetzt kostenlos starten!
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              {GRATIS_ANALYSEN === 1 ? 'Deine erste Wohnung' : `Deine ersten ${GRATIS_ANALYSEN} Wohnungen`} komplett gratis analysieren, inklusive:
            </p>
            {/* Vorteile kompakt, damit das Formular mobil weit oben bleibt */}
            <ul className="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] font-semibold text-[#001d3d]">
              {GRATIS_VORTEILE.map(([titel]) => (
                <li key={titel} className="flex items-center gap-1.5">
                  <Check size={15} strokeWidth={2.6} className="shrink-0 text-emerald-500" />{titel}
                </li>
              ))}
            </ul>
          </div>

          {/* Clerk Sign Up */}
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] hover:opacity-90 transition-opacity',
                card: 'shadow-2xl border-2 border-[hsl(var(--brand))]/10',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-[hsl(var(--brand))]/30',
                formFieldInput: 'border-2 border-gray-200 focus:border-[hsl(var(--brand))]',
                footerActionLink: 'text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-2))]',
              },
            }}
            fallbackRedirectUrl="/input-method"
            signInUrl="/sign-in"
          />

          {/* Additional Info */}
          <div className="mt-6 text-center md:mt-8">
            <p className="mb-2 text-xs text-gray-500">Ohne Kreditkarte, kein Abo. Szenarien und PDF-Report inklusive.</p>
            <p className="text-sm text-gray-500">
              Bereits registriert?{' '}
              <Link href="/sign-in" className="text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-2))] font-semibold">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
