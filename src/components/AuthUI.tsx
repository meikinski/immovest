'use client';

import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component with client-side Clerk detection
 *
 * - Uses Clerk's useAuth() hook to check auth status
 * - Falls back to static link during SSR
 * - Shows UserButton for signed-in users
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before Clerk loads: show static link
  if (!mounted || !isLoaded) {
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

  // Client-side: Show full Clerk UserButton for signed-in users
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

  // Not signed in: show static link
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
