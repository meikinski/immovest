// Recherche-Ergebnisse des Markt-Agents (Teilmenge von ResearchSchema in src/lib/agentWorkflow.ts),
// die im Markt-Tab angezeigt und mit der Analyse gespeichert werden.
export type MarketFacts = {
  location?: { postal_code: string | null; district: string | null; notes: string | null };
  rent?: { median_psqm: number | null; range_psqm: { low: number; high: number } | null };
  price?: { median_psqm: number | null; range_psqm: { low: number; high: number } | null };
  vacancy?: { risk: 'niedrig' | 'mittel' | 'hoch' | null; rate: number | null };
  demand?: { drivers: string[] };
  citations?: Array<{ title: string; url: string; domain: string }>;
};
