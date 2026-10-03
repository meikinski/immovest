'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { LayoutGrid } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/** Rahmen für Meine Analysen und die Kontoseiten: Kopfleiste und Titel */
export function KontoSeite({
  titel, untertitel, aktionen, schmal = false, children,
}: {
  titel: string;
  untertitel?: string;
  aktionen?: React.ReactNode;
  schmal?: boolean;
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname || '/analysen')}`);
  }, [isLoaded, isSignedIn, router, pathname]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header variant="sticky" />
      <main className={`mx-auto px-4 pb-16 pt-8 sm:px-6 md:pt-10 ${schmal ? 'max-w-3xl' : 'max-w-7xl'}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#001d3d] md:text-[28px]">{titel}</h1>
            {untertitel && <p className="mt-1 text-sm text-slate-500">{untertitel}</p>}
          </div>
          {aktionen}
        </div>
        {children}
      </main>
    </div>
  );
}

/** Weiße Karte mit Titel für die Kontoseiten */
export function KontoKarte({
  titel, icon: Icon, children, gefahr = false,
}: {
  titel: string;
  icon: typeof LayoutGrid;
  children: React.ReactNode;
  gefahr?: boolean;
}) {
  return (
    <section className={`rounded-2xl border bg-white p-5 shadow-sm md:p-6 ${gefahr ? 'border-red-200' : 'border-slate-200/80'}`}>
      <h2 className={`flex items-center gap-2 text-[15px] font-bold ${gefahr ? 'text-red-600' : 'text-[#001d3d]'}`}>
        <Icon size={18} className={gefahr ? 'text-red-600' : 'text-[#ff6b00]'} />
        {titel}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
