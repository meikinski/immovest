'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { BarChart3, LayoutDashboard, Save } from 'lucide-react';

interface HeaderProps {
  variant?: 'fixed' | 'sticky' | 'static';
}

export function Header({ variant = 'fixed' }: HeaderProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const positionClass = variant === 'fixed'
    ? 'fixed top-0 left-0 right-0'
    : variant === 'sticky'
    ? 'sticky top-0'
    : '';

  return (
    <header className={`${positionClass} bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">
            ImmoVest
          </span>
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <SignInButton
              mode="modal"
              forceRedirectUrl="/input-method"
              fallbackRedirectUrl="/input-method"
            >
              <button className="text-sm font-medium text-gray-700 hover:text-[hsl(var(--brand))] transition">
                Anmelden
              </button>
            </SignInButton>
          ) : (
            <UserButton afterSignOutUrl="/">
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Profil & Einstellungen"
                  labelIcon={<Save size={16} />}
                  href="/profile"
                />
              </UserButton.MenuItems>
            </UserButton>
          )}
        </div>
      </div>
    </header>
  );
}
