'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component for public pages
 * Shows profile button for logged-in users, "Anmelden" for guests
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, show nothing to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-8 h-8" /> // Placeholder to prevent layout shift
    );
  }

  return <AuthUIClient variant={variant} />;
}

function AuthUIClient({ variant }: AuthUIProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // While Clerk is loading, show placeholder
  if (!isLoaded) {
    return (
      <div className="w-8 h-8" /> // Placeholder to prevent layout shift
    );
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
