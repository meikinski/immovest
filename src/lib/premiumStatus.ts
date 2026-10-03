export interface PremiumStatusAntwort {
  isPremium: boolean;
  usageCount: number;
  premiumUntil: string | null;
  usingFallback?: boolean;
}

type GetToken = () => Promise<string | null>;

/**
 * Fragt /api/premium/status mit frischem Clerk-Token ab.
 * Auf Mobilgeräten ist das Session-Cookie nach dem Aufwecken des Tabs oft abgelaufen,
 * dann antwortet der Server mit 401 und der Nutzer wirkt wie ein Gratis-Nutzer.
 * getToken() erneuert das Token bei Bedarf, deshalb schicken wir es zusätzlich als Bearer-Header.
 */
export async function premiumStatusAbrufen(getToken: GetToken, versuche = 3): Promise<PremiumStatusAntwort | null> {
  for (let versuch = 0; versuch < versuche; versuch++) {
    try {
      let token: string | null = null;
      try {
        token = await getToken();
      } catch { /* ohne Token weiter, Cookie kann reichen */ }

      const r = await fetch('/api/premium/status', {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (r.ok) {
        const d = await r.json();
        return {
          isPremium: !!d?.isPremium,
          usageCount: Number(d?.usageCount) || 0,
          premiumUntil: d?.premiumUntil ?? null,
          usingFallback: !!d?.usingFallback,
        };
      }
    } catch { /* Netzwerkfehler: nochmal versuchen */ }
    if (versuch < versuche - 1) await new Promise(res => setTimeout(res, 800 * (versuch + 1)));
  }
  return null;
}
