'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useIsClerkLoaded } from './SmartClerkProvider';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

// Dynamically import the client component that uses Clerk hooks
// This prevents Clerk imports during SSR and for bot requests
const AuthUIClient = dynamic(
  () => import('./AuthUIClient').then((mod) => ({ default: mod.AuthUIClient })),
  { ssr: false }
);

/**
 * Auth UI component for public pages with SmartClerkProvider
 *
 * - During SSR/for bots: Shows "Anmelden" (clean for Google indexing)
 * - For real users after mount: Shows profile button when logged in
 *
 * Professional solution used by major websites.
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const isClerkLoaded = useIsClerkLoaded();

  // During SSR and for bots: show "Anmelden" link (SEO-friendly, no Clerk)
  if (!isClerkLoaded) {
    return (
      <Link
        href="/sign-in"
        className={`text-sm font-medium transition-colors ${
          variant === 'dark'
            ? 'text-white/90 hover:text-white'
            : 'text-gray-700 hover:text-[hsl(var(--brand))]'
        }`}
      >
        Anmelden
      </Link>
    );
  }

  // For real users: dynamically load the auth-aware component
  return <AuthUIClient variant={variant} />;
}
