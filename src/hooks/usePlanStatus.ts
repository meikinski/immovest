'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { premiumStatusAbrufen } from '@/lib/premiumStatus';

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

async function abrufen(userId: string, getToken: () => Promise<string | null>): Promise<PlanStatus> {
  const d = await premiumStatusAbrufen(getToken);
  if (d && !d.usingFallback) {
    const status: PlanStatus = {
      loaded: true,
      isPremium: d.isPremium,
      usageCount: d.usageCount,
      premiumUntil: d.premiumUntil,
    };
    try {
      localStorage.setItem(`is_premium_${userId}`, status.isPremium ? 'true' : 'false');
      localStorage.setItem(`premium_usage_${userId}`, String(status.usageCount));
    } catch { /* privater Modus */ }
    return status;
  }
  // Fehlgeschlagene Abrufe nicht zwischenspeichern, damit der nächste Seitenaufruf neu fragt
  if (cache?.userId === userId) cache = null;
  return ausSpeicher(userId);
}

function ladeStatus(userId: string, getToken: () => Promise<string | null>): Promise<PlanStatus> {
  if (cache?.userId === userId) return cache.promise;
  cache = { userId, promise: abrufen(userId, getToken) };
  return cache.promise;
}

/** Plan des angemeldeten Nutzers, unabhängig vom PaywallProvider (auch auf öffentlichen Seiten nutzbar) */
export function usePlanStatus(): PlanStatus {
  const { isSignedIn, userId, getToken } = useAuth();
  const [status, setStatus] = useState<PlanStatus>({ loaded: false, isPremium: false, usageCount: 0, premiumUntil: null });

  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let aktiv = true;
    const laden = () => ladeStatus(userId, getToken).then(s => { if (aktiv) setStatus(s); });
    laden();
    // Mobil: Tab kommt aus dem Hintergrund zurück → Status frisch abfragen
    const beiSichtbar = () => {
      if (document.visibilityState === 'visible') { cache = null; laden(); }
    };
    document.addEventListener('visibilitychange', beiSichtbar);
    return () => { aktiv = false; document.removeEventListener('visibilitychange', beiSichtbar); };
  }, [isSignedIn, userId, getToken]);

  return status;
}

/** Nach Kauf oder Kündigung neu laden */
export function vergissPlanStatus() {
  cache = null;
}
