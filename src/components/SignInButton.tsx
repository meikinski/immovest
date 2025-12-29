'use client';

import Link from 'next/link';
import { LogIn, BarChart3 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Sign-in button for public pages with client-side Clerk detection
 * - Uses Clerk's useAuth() hook to check auth status
 * - Shows "Meine Analysen" for signed-in users
 * - Shows "Einloggen/Anmelden" for guests
 */
export function SignInButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before Clerk loads: show sign-in button
  if (!mounted || !isLoaded) {
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

  // Show profile/analyses button for signed-in users
  if (isSignedIn) {
    return (
      <Link
        href="/profile"
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-10 py-4 text-base font-semibold text-white/90 transition-all duration-200 hover:bg-white/10 hover:border-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 sm:w-auto"
      >
        <BarChart3 className="h-5 w-5" />
        Meine Analysen
      </Link>
    );
  }

  // Show sign-in button for guests
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
