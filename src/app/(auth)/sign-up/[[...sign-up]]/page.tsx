'use client';

import { SignUp, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="py-6 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-12 h-12 relative">
            <Image
              src="/logo.png"
              alt="ImVestr Logo"
              width={48}
              height={48}
              className="rounded-lg"
              priority
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter">
            imvestr
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Jetzt kostenlos starten!
            </h1>
            <p className="text-gray-600">
              Erstelle deinen Account und analysiere deine erste Immobilie
            </p>
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
          <div className="mt-8 text-center">
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
