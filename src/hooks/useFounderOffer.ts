'use client';

import { useEffect, useState } from 'react';
import type { FounderOffer } from '@/lib/founderOffer';

let anfrage: Promise<FounderOffer> | null = null;

function ladeAngebot(): Promise<FounderOffer> {
  if (!anfrage) {
    anfrage = fetch('/api/pricing/offer')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { founder?: FounderOffer } | null) => d?.founder ?? { active: false as const })
      .catch(() => ({ active: false as const }));
  }
  return anfrage;
}

/**
 * Gründerpreis-Angebot vom Server (Env-Variablen, Enddatum serverseitig geprüft).
 * Zusätzlich clientseitig: endet das Angebot, während die Seite offen ist, verschwindet es.
 */
export function useFounderOffer(): FounderOffer | null {
  const [angebot, setAngebot] = useState<FounderOffer | null>(null);

  useEffect(() => {
    let aktiv = true;
    ladeAngebot().then(a => { if (aktiv) setAngebot(a); });
    return () => { aktiv = false; };
  }, []);

  useEffect(() => {
    if (!angebot?.active) return;
    const rest = Math.max(0, new Date(angebot.endsAt).getTime() - Date.now());
    // setTimeout verträgt max. ~24,8 Tage; danach greift spätestens das nächste Laden der Seite
    if (rest > 2_147_000_000) return;
    const t = setTimeout(() => setAngebot({ active: false }), rest);
    return () => clearTimeout(t);
  }, [angebot]);

  return angebot;
}
