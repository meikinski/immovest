'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useClerk, useUser } from '@clerk/nextjs';
import {
  BookOpen, CircleHelp, Crown, CreditCard, LayoutGrid, LogOut, Menu, Plus, User, X, type LucideIcon,
} from 'lucide-react';
import { useImmoStore } from '@/store/useImmoStore';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { GRATIS_ANALYSEN } from '@/lib/preise';

interface HeaderProps {
  variant?: 'fixed' | 'sticky' | 'static';
}

const KONTO_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '/analysen', label: 'Meine Analysen', icon: LayoutGrid },
  { href: '/profile', label: 'Profil & Einstellungen', icon: User },
  { href: '/abo', label: 'Abo & Zahlung', icon: CreditCard },
  { href: '/hilfe', label: 'Hilfe & Fragen', icon: CircleHelp },
];

function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 transition hover:opacity-80" aria-label="imvestr Startseite">
      <Image src="/logo-192.png" alt="" width={36} height={36} className="rounded-lg" priority />
      <span className="text-xl font-extrabold tracking-tighter text-[#001d3d] sm:text-2xl">imvestr</span>
    </Link>
  );
}

function initialen(name: string | null | undefined, email: string | undefined) {
  const quelle = (name || email || '?').trim();
  const teile = quelle.split(/[\s@._-]+/).filter(Boolean);
  return ((teile[0]?.[0] ?? '?') + (teile[1]?.[0] ?? '')).toUpperCase();
}

/** Plan in Klartext für Kontomenü und Kopfleiste */
function usePlanText() {
  const plan = usePlanStatus();
  const uebrig = Math.max(0, GRATIS_ANALYSEN - plan.usageCount);
  const bis = plan.premiumUntil
    ? new Date(plan.premiumUntil).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
  return {
    ...plan,
    uebrig,
    kurz: uebrig === 1 ? 'Noch 1 kostenlose Analyse' : uebrig > 1 ? `Noch ${uebrig} kostenlose Analysen` : 'Kostenlose Analysen aufgebraucht',
    bis,
  };
}

function KontoMenue({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const plan = usePlanText();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 p-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f63c9] to-[#001d3d] text-sm font-extrabold text-white">
          {initialen(user?.fullName, email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#001d3d]">{user?.fullName || 'Dein Konto'}</p>
          {email && <p className="truncate text-xs text-slate-400">{email}</p>}
        </div>
      </div>

      {plan.loaded && (
        plan.isPremium ? (
          <div className="mx-1.5 mb-2 rounded-xl bg-[#fff7f0] px-3 py-2.5">
            <p className="text-[13px] font-bold text-[#001d3d]">Premium</p>
            {plan.bis && <p className="text-xs text-slate-600">Aktiv bis {plan.bis}</p>}
          </div>
        ) : (
          <div className="mx-1.5 mb-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div>
              <p className="text-[13px] font-bold text-[#001d3d]">Kostenloser Plan</p>
              <p className="text-xs text-slate-600">{plan.kurz}</p>
            </div>
            <Link href="/abo" onClick={onNavigate} className="whitespace-nowrap text-xs font-bold text-[#ff6b00] hover:underline">
              Zu Premium
            </Link>
          </div>
        )
      )}

      {KONTO_LINKS.map(({ href, label, icon: Icon }) => {
        const aktiv = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            role="menuitem"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[#001d3d] transition-colors ${aktiv ? 'bg-[#fff7f0]' : 'hover:bg-slate-100'}`}
          >
            <Icon size={17} className={aktiv ? 'text-[#ff6b00]' : 'text-slate-500'} />
            {label}
          </Link>
        );
      })}
      <div className="mx-1 my-1.5 border-t border-slate-100" />
      <button
        type="button"
        role="menuitem"
        onClick={() => { onNavigate(); signOut({ redirectUrl: '/' }); }}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
      >
        <LogOut size={17} />
        Abmelden
      </button>
    </div>
  );
}

function PlanChip() {
  const plan = usePlanText();
  if (!plan.loaded) return null;
  if (plan.isPremium) {
    return (
      <Link href="/abo" className="hidden items-center gap-1.5 rounded-full border border-orange-200 bg-[#fff7f0] px-3 py-1.5 text-xs font-bold text-[#001d3d] lg:flex">
        <Crown size={14} className="text-[#ff6b00]" /> Premium
      </Link>
    );
  }
  return (
    <Link href="/abo" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 lg:flex">
      {plan.kurz}
      <span className="rounded-full bg-[#001d3d] px-2.5 py-1 font-bold text-white">Upgrade</span>
    </Link>
  );
}

export function Header({ variant = 'fixed' }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const resetAnalysis = useImmoStore(s => s.resetAnalysis);
  const [menuOffen, setMenuOffen] = useState(false);
  const [mobilOffen, setMobilOffen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const positionClass = variant === 'fixed' ? 'fixed top-0 left-0 right-0' : variant === 'sticky' ? 'sticky top-0' : '';

  // Kontomenü schließen bei Klick außerhalb oder Escape
  useEffect(() => {
    if (!menuOffen) return;
    const onClick = (e: MouseEvent) => {
      const ziel = e.target as Node;
      if (menuRef.current?.contains(ziel) || sheetRef.current?.contains(ziel)) return;
      setMenuOffen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOffen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOffen]);

  // Beim Seitenwechsel alles schließen
  useEffect(() => { setMenuOffen(false); setMobilOffen(false); }, [pathname]);

  const neueAnalyse = () => {
    resetAnalysis();
    router.push('/input-method');
  };

  const email = user?.primaryEmailAddress?.emailAddress;
  const navLink = (href: string, label: string, Icon: LucideIcon) => {
    const aktiv = pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`));
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${aktiv ? 'bg-[#fff7f0] text-[#001d3d]' : 'text-slate-600 hover:bg-slate-100 hover:text-[#001d3d]'}`}
      >
        <Icon size={17} className={aktiv ? 'text-[#ff6b00]' : ''} />
        {label}
      </Link>
    );
  };

  if (!isSignedIn) {
    return (
      <header className={`${positionClass} z-50 border-b border-slate-100 bg-white/90 backdrop-blur-lg`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo href="/" />
          <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Hauptnavigation">
            <Link href="/#ablauf" className="hover:text-[#001d3d]">So funktioniert&apos;s</Link>
            <Link href="/pricing" className="hover:text-[#001d3d]">Preise</Link>
            <Link href="/blog" className="hover:text-[#001d3d]">Blog</Link>
          </nav>
          <Link href="/sign-in" className="ml-auto text-sm font-bold text-[#001d3d] md:ml-0">Anmelden</Link>
          <Link href="/input-method" className="hidden rounded-xl bg-[#ff6b00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#ff6b00]/90 md:inline-flex">
            Kostenlos starten
          </Link>
          <button
            type="button"
            onClick={() => setMobilOffen(!mobilOffen)}
            aria-expanded={mobilOffen}
            aria-label={mobilOffen ? 'Menü schließen' : 'Menü öffnen'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 md:hidden"
          >
            {mobilOffen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobilOffen && (
          <nav className="flex flex-col border-t border-slate-100 bg-white px-4 pb-5 md:hidden" aria-label="Mobiles Menü">
            {[['/#ablauf', "So funktioniert's"], ['/pricing', 'Preise'], ['/blog', 'Blog']].map(([href, label]) => (
              <Link key={href} href={href} className="border-b border-slate-100 py-3 font-semibold text-[#001d3d]">{label}</Link>
            ))}
            <Link href="/input-method" className="mt-4 rounded-xl bg-[#ff6b00] py-3 text-center font-bold text-white">
              Erste Wohnung kostenlos prüfen
            </Link>
          </nav>
        )}
      </header>
    );
  }

  return (
    <header className={`${positionClass} z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <Logo href="/analysen" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="App">
          {navLink('/analysen', 'Meine Analysen', LayoutGrid)}
          {navLink('/blog', 'Blog', BookOpen)}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <PlanChip />
          <button
            type="button"
            onClick={neueAnalyse}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6b00] px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-[#ff6b00]/90 sm:px-4"
            aria-label="Neue Analyse"
          >
            <Plus size={17} strokeWidth={2.6} />
            <span className="hidden sm:inline">Neue Analyse</span>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOffen(!menuOffen)}
              aria-haspopup="menu"
              aria-expanded={menuOffen}
              aria-label="Kontomenü"
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1f63c9] to-[#001d3d] text-sm font-extrabold text-white ring-2 transition ${menuOffen ? 'ring-[#ff6b00]' : 'ring-white'} shadow`}
            >
              {initialen(user?.fullName, email)}
            </button>
            {menuOffen && (
              <div role="menu" className="absolute right-0 top-12 hidden w-[300px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl md:block">
                <KontoMenue onNavigate={() => setMenuOffen(false)} />
              </div>
            )}
            {/* Handy: Blatt von unten, per Portal außerhalb der Kopfleiste (backdrop-blur würde fixed begrenzen) */}
            {menuOffen && typeof document !== 'undefined' && createPortal(
              <div className="md:hidden">
                <div className="fixed inset-0 z-[60] bg-[#001d3d]/35" onClick={() => setMenuOffen(false)} aria-hidden />
                <div
                  ref={sheetRef}
                  role="menu"
                  className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl bg-white px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl"
                >
                  <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-slate-200" />
                  <KontoMenue onNavigate={() => setMenuOffen(false)} />
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
