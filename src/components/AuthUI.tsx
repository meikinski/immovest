'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { useIsClerkLoaded } from './SmartClerkProvider';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

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

  // For real users: show actual auth state
  return <AuthUIClient variant={variant} />;
}

/**
 * Client-only component that uses Clerk hooks
 * Only rendered for real users after SmartClerkProvider has loaded Clerk
 */
function AuthUIClient({ variant }: AuthUIProps) {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <UserButton afterSignOutUrl="/">
        <UserButton.MenuItems>
          <UserButton.Link
            label="Profil & Einstellungen"
            labelIcon={<Save className="h-4 w-4" />}
            href="/profile"
          />
        </UserButton.MenuItems>
      </UserButton>
    );
  }

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

