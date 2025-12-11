'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { Save } from 'lucide-react';
import { useAuthStatus } from './AuthProvider';
import { useEffect, useState } from 'react';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component with hybrid rendering strategy
 *
 * SSR (for Google/Bots):
 * - Always shows static "Anmelden" link
 * - No Clerk JavaScript
 *
 * Client-Side (for real users):
 * - If signed in: Full Clerk UserButton with profile, saved objects, subscription, etc.
 * - If not signed in: Static "Anmelden" link
 *
 * Why this works:
 * ✅ Google/Bots are NEVER signed in → only see static link
 * ✅ Real signed-in users get full Clerk functionality
 * ✅ No Clerk scripts for bots/non-authenticated users
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const { isSignedIn } = useAuthStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR: show static link for Google
  if (!mounted) {
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
