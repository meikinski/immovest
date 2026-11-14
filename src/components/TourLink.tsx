'use client';

import { useEffect } from 'react';
import { CircleHelp } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

type TourStep = 'a' | 'a2' | 'b' | 'c' | 'tabs';

/**
 * Startet die Tour der aktuellen Seite auf Wunsch. Touren öffnen sich nie von selbst.
 * Ausnahme: Hilfe- und Profilseite verlinken mit ?tour=1, das ist ein ausdrücklicher Start durch den Nutzer.
 */
export function TourLink({ step, hell = false, className = '' }: { step: TourStep; hell?: boolean; className?: string }) {
  const { startTour } = useOnboarding();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') !== '1') return;
    params.delete('tour');
    const rest = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''));
    const timer = setTimeout(() => startTour({ step }), 400);
    return () => clearTimeout(timer);
  }, [startTour, step]);

  return (
    <button
      type="button"
      onClick={() => startTour({ step })}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline ${
        hell ? 'text-white/80 hover:text-white' : 'text-slate-500 hover:text-[#001d3d]'
      } ${className}`}
    >
      <CircleHelp size={14} aria-hidden />
      Kurze Tour
    </button>
  );
}
