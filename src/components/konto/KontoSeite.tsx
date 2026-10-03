'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { BookOpen, LayoutGrid, Plus, User } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useImmoStore } from '@/store/useImmoStore';

/** Rahmen für Meine Analysen und die Kontoseiten: Kopfleiste, Titel, auf dem Handy die Leiste unten */
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
  const resetAnalysis = useImmoStore(s => s.resetAnalysis);

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

  const tab = (href: string, label: string, Icon: typeof LayoutGrid, aktiv: boolean) => (
    <Link href={href} className={`flex flex-col items-center gap-0.5 text-[11px] font-semibold ${aktiv ? 'text-[#001d3d]' : 'text-slate-400'}`}>
      <Icon size={20} className={aktiv ? 'text-[#ff6b00]' : ''} />
      {label}
    </Link>
  );
  const kontoAktiv = ['/profile', '/abo', '/hilfe'].includes(pathname ?? '');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header variant="sticky" />
      <main className={`mx-auto px-4 pb-28 pt-8 sm:px-6 md:pb-16 md:pt-10 ${schmal ? 'max-w-3xl' : 'max-w-7xl'}`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#001d3d] md:text-[28px]">{titel}</h1>
            {untertitel && <p className="mt-1 text-sm text-slate-500">{untertitel}</p>}
          </div>
          {aktionen}
        </div>
        {children}
      </main>

      {/* Handy: Leiste unten */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden" aria-label="App">
        {tab('/analysen', 'Analysen', LayoutGrid, pathname === '/analysen')}
        <button
          type="button"
          onClick={() => { resetAnalysis(); router.push('/input-method'); }}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-slate-400"
        >
          <span className="-mt-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff6b00] text-white shadow-lg shadow-orange-500/30">
            <Plus size={22} strokeWidth={2.6} />
          </span>
          Neu
        </button>
        {tab('/blog', 'Blog', BookOpen, false)}
        {tab('/profile', 'Konto', User, kontoAktiv)}
      </nav>
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
