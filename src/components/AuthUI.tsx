'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsClerkLoaded } from './SmartClerkProvider';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component for public pages with SmartClerkProvider
 * - Bots: See "Anmelden" link (no Clerk, clean HTML)
 * - Real users: See profile button when logged in
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const [mounted, setMounted] = useState(false);
  const isClerkLoaded = useIsClerkLoaded();

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, show placeholder
  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  // If Clerk is not loaded (bot), show static link
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

  // Clerk is loaded, use auth-aware component
  return <AuthUIClient variant={variant} />;
}

function AuthUIClient({ variant }: AuthUIProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // While Clerk is initializing, show placeholder
  if (!isLoaded) {
    return <div className="w-8 h-8" />;
  }

  // Show profile button for signed-in users
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

  // Show "Anmelden" for guests
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
