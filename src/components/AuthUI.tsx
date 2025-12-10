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
 * Always shows "Anmelden" link since ClerkProvider is not available on public pages
 * This is a compromise for Google indexing - logged-in users will see "Anmelden" too on public pages
 */
export function AuthUI({ variant = 'light' }: AuthUIProps) {
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
