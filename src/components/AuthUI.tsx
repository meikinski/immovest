'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuthStatus } from './AuthProvider';

interface AuthUIProps {
  variant?: 'light' | 'dark';
}

/**
 * Auth UI component for public pages with server-side auth
 * - Uses auth status from AuthProvider (server-side check)
 * - NO Clerk client-side JavaScript loaded
 * - Shows profile link for signed-in users
 * - Shows "Anmelden" for guests
 *
 * This ensures:
 * ✅ Google sees static HTML (no Clerk scripts)
 * ✅ Users see correct state (profile link when logged in)
 * ✅ No client-side Clerk overhead
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
  const { isSignedIn } = useAuthStatus();

  // Show profile link for signed-in users
  if (isSignedIn) {
    return (
      <Link
        href="/input-method"
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          variant === 'dark'
            ? 'text-white/90 hover:text-white'
            : 'text-gray-700 hover:text-[hsl(var(--brand))]'
        }`}
      >
        <User className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
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
