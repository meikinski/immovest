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

function ladeStatus(userId: string): Promise<PlanStatus> {
  if (cache?.userId === userId) return cache.promise;
  const promise = fetch('/api/premium/status')
    .then(r => (r.ok ? r.json() : null))
    .then(d => ({
      loaded: true,
      isPremium: !!d?.isPremium,
      usageCount: Number(d?.usageCount) || 0,
      premiumUntil: d?.premiumUntil ?? null,
    }))
    .catch(() => ({ loaded: true, isPremium: false, usageCount: 0, premiumUntil: null }));
  cache = { userId, promise };
  return promise;
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
