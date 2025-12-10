'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useIsClerkLoaded } from './SmartClerkProvider';

// Dynamically import the client component that uses Clerk hooks
// This prevents Clerk imports during SSR and for bot requests
const SignInButtonClient = dynamic(
  () => import('./SignInButtonClient').then((mod) => ({ default: mod.SignInButtonClient })),
  { ssr: false }
);

/**
 * Sign-in button for public pages with SmartClerkProvider
 *
 * - During SSR/for bots: Shows "Einloggen/Anmelden" (clean for Google indexing)
 * - For real users after mount: Shows "Zum Dashboard" if logged in
 *
 * Professional solution used by major websites.
 */
export function SignInButton() {
  const isClerkLoaded = useIsClerkLoaded();

  // During SSR and for bots: show sign-in button (SEO-friendly, no Clerk)
  if (!isClerkLoaded) {
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

  // For real users: dynamically load the auth-aware component
  return <SignInButtonClient />;
}
