'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Sign-in button for public-interactive pages
 * Hides after hydration if user is already signed in
 * Works with InteractiveClerkProvider which loads Clerk client-side only
 */
export function SignInButton() {
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show button during SSR and initial render (for SEO)
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

  // After hydration, only show if not signed in
  if (isSignedIn) {
    return null;
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
}
