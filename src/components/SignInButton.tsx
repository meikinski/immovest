'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';

/**
 * Sign-in button for public pages
 * Always shows the button since ClerkProvider is not available on public pages
 * This is a compromise for Google indexing
 */
export function SignInButton() {
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
