'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component for public-interactive pages
 * Shows "Anmelden" before hydration, then shows auth state after hydration
 * Works with InteractiveClerkProvider which loads Clerk client-side only
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show "Anmelden" during SSR and before auth loads (for Google)
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

  // After hydration, show actual auth state
  return isSignedIn ? (
    <UserButton afterSignOutUrl="/">
      <UserButton.MenuItems>
        <UserButton.Link
          label="Profil & Einstellungen"
          labelIcon={<Save size={16} />}
          href="/profile"
        />
      </UserButton.MenuItems>
    </UserButton>
  ) : (
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

