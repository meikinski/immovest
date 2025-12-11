'use client';

import Link from 'next/link';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Sign-in button for public pages
 * Shows "Zum Dashboard" for logged-in users, "Einloggen/Anmelden" for guests
 */
export function SignInButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, show sign-in button
  if (!mounted) {
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

  return <SignInButtonClient />;
}

function SignInButtonClient() {
  const { isSignedIn, isLoaded } = useAuth();

  // While Clerk is loading, show sign-in button
  if (!isLoaded) {
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

  // Show dashboard button for signed-in users
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
