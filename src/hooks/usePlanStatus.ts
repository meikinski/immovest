'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface PlanStatus {
  loaded: boolean;
  isPremium: boolean;
  usageCount: number;
  premiumUntil: string | null;
}

// Ein Abruf pro Seitenaufruf, auch wenn mehrere Komponenten den Status brauchen
let cache: { userId: string; promise: Promise<PlanStatus> } | null = null;

/** Letzter bekannter Stand, den auch der PaywallProvider schreibt */
function ausSpeicher(userId: string): PlanStatus {
  try {
    return {
      loaded: true,
      isPremium: localStorage.getItem(`is_premium_${userId}`) === 'true',
      usageCount: Number(localStorage.getItem(`premium_usage_${userId}`)) || 0,
      premiumUntil: null,
    };
  } catch {
    return { loaded: true, isPremium: false, usageCount: 0, premiumUntil: null };
  }
}

async function abrufen(userId: string): Promise<PlanStatus> {
  // Ein zweiter Versuch, falls die Sitzung beim ersten Aufruf noch nicht bereit war
  for (let versuch = 0; versuch < 2; versuch++) {
    try {
      const r = await fetch('/api/premium/status', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (!d?.usingFallback) {
          const status: PlanStatus = {
            loaded: true,
            isPremium: !!d.isPremium,
            usageCount: Number(d.usageCount) || 0,
            premiumUntil: d.premiumUntil ?? null,
          };
          try {
            localStorage.setItem(`is_premium_${userId}`, status.isPremium ? 'true' : 'false');
            localStorage.setItem(`premium_usage_${userId}`, String(status.usageCount));
          } catch { /* privater Modus */ }
          return status;
        }
        break;
      }
    } catch { /* Netzwerkfehler: nochmal versuchen */ }
    if (versuch === 0) await new Promise(res => setTimeout(res, 800));
  }
  // Fehlgeschlagene Abrufe nicht zwischenspeichern, damit der nächste Seitenaufruf neu fragt
  if (cache?.userId === userId) cache = null;
  return ausSpeicher(userId);
}

function ladeStatus(userId: string): Promise<PlanStatus> {
  if (cache?.userId === userId) return cache.promise;
  cache = { userId, promise: abrufen(userId) };
  return cache.promise;
}

/** Plan des angemeldeten Nutzers, unabhängig vom PaywallProvider (auch auf öffentlichen Seiten nutzbar) */
export function usePlanStatus(): PlanStatus {
  const { isSignedIn, userId } = useAuth();
  const [status, setStatus] = useState<PlanStatus>({ loaded: false, isPremium: false, usageCount: 0, premiumUntil: null });

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let aktiv = true;
    ladeStatus(userId).then(s => { if (aktiv) setStatus(s); });
    return () => { aktiv = false; };
  }, [isSignedIn, userId]);

  return status;
}

/** Nach Kauf oder Kündigung neu laden */
export function vergissPlanStatus() {
  cache = null;
}
