'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Save } from 'lucide-react';

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
          className="flex items-center gap-1 hover:opacity-80 transition"
        >
          <div className="w-12 h-12 relative">
            <Image
              src="/logo.png"
              alt="imvestr Logo"
              width={48}
              height={48}
              className="rounded-lg"
              priority
            />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter">
            imvestr
          </span>
        </button>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <Link href="/sign-in" className="bg-[#001d3d] text-white px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg">
              Login
            </Link>
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
