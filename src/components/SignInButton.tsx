'use client';

import Link from 'next/link';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Sign-in button for public pages with SmartClerkProvider
 *
 * - During SSR/for bots: Shows "Einloggen/Anmelden" (clean for Google indexing)
 * - For real users after mount: Shows "Zum Dashboard" if logged in
 *
 * Professional solution used by major websites.
 */
export function SignInButton() {
  const [mounted, setMounted] = useState(false);
  const [isClerkReady, setIsClerkReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Small delay to ensure Clerk has initialized if it's going to
    const timer = setTimeout(() => {
      setIsClerkReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // During SSR and for bots: show sign-in button (SEO-friendly, no Clerk)
  if (!mounted || !isClerkReady) {
    return (
      <Link
        href="/sign-in"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto"
      >
        <LogIn className="h-5 w-5" />
        Einloggen/Anmelden
      </Link>
    );
  }

  // For real users after mount: show actual auth state
  return <SignInButtonClient />;
}

/**
 * Client-only component that uses Clerk hooks
 * Only rendered for real users after SmartClerkProvider has loaded Clerk
 */
function SignInButtonClient() {
  try {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
      return (
        <Link
          href="/input-method"
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto"
        >
          <LayoutDashboard className="h-5 w-5" />
          Zum Dashboard
        </Link>
      );
    }

    return (
      <Link
        href="/sign-in"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto"
      >
        <LogIn className="h-5 w-5" />
        Einloggen/Anmelden
      </Link>
    );
  } catch (error) {
    // If Clerk isn't available (bot request), show sign-in button
    return (
      <Link
        href="/sign-in"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto"
      >
        <LogIn className="h-5 w-5" />
        Einloggen/Anmelden
      </Link>
    );
  }
}
