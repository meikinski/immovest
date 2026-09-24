// Strukturierter KI-Strategie-Check (Tab 1).
// Wird als JSON-String in `generatedComment` gespeichert. Ältere Analysen
// enthalten dort noch reines HTML – parseStrategyCheck() gibt dann null zurück.

export type StrategyTone = 'positive' | 'neutral' | 'negative';

export type StrategyCheck = {
  v: 2;
  tone: StrategyTone;
  verdict: string;          // Kurzes Urteil fürs Badge, z. B. "Solides Investment"
  summary: string;          // 1–2 Sätze Kernaussage
  staerken: string[];       // 1–3 Punkte
  risiken: string[];        // 1–3 Punkte
  naechsterSchritt: string; // 1 Satz
};

export function toneFromNumbers(cashflow: number, dscr?: number): StrategyTone {
  const d = typeof dscr === 'number' && Number.isFinite(dscr) ? dscr : undefined;
  if (cashflow < -100 || (d !== undefined && d < 1)) return 'negative';
  if (cashflow >= 50 && (d === undefined || d >= 1.2)) return 'positive';
  return 'neutral';
}

export const DEFAULT_VERDICT: Record<StrategyTone, string> = {
  positive: 'Solides Investment',
  neutral: 'Grenzwertig – genau prüfen',
  negative: 'Rechnet sich so nicht',
};

const toStringList = (x: unknown, max = 3): string[] =>
  Array.isArray(x)
    ? x.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map(s => s.trim()).slice(0, max)
    : [];

export function parseStrategyCheck(raw: string | null | undefined): StrategyCheck | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    if (obj.v !== 2) return null;
    const tone: StrategyTone =
      obj.tone === 'positive' || obj.tone === 'negative' ? obj.tone : 'neutral';
    const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
    if (!summary) return null;
    return {
      v: 2,
      tone,
      verdict: typeof obj.verdict === 'string' && obj.verdict.trim() ? obj.verdict.trim() : DEFAULT_VERDICT[tone],
      summary,
      staerken: toStringList(obj.staerken),
      risiken: toStringList(obj.risiken),
      naechsterSchritt: typeof obj.naechsterSchritt === 'string' ? obj.naechsterSchritt.trim() : '',
    };
  } catch {
    return null;
  }
}
