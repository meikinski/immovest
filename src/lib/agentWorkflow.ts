// src/lib/agentWorkflow.ts
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';

export type WorkflowInput = {
  input_as_text?: string;
  payload?: unknown;
};

const RangeObjectSchema = z.object({ low: z.number(), high: z.number() }).nullable();
const ResearchSchema = z.object({
  location: z.object({
    postal_code: z.string().nullable(),
    district: z.string().nullable(),
    confidence: z.enum(['niedrig', 'mittel', 'hoch']).nullable(),
    notes: z.string().nullable(),
  }),
  rent: z.object({
    median_psqm: z.number().nullable(),
    range_psqm: RangeObjectSchema,
    notes: z.string().nullable(),
  }),
  price: z.object({
    median_psqm: z.number().nullable(),
    range_psqm: RangeObjectSchema,
    notes: z.string().nullable(),
  }),
  vacancy: z.object({
    risk: z.enum(['niedrig', 'mittel', 'hoch']).nullable(),
    rate: z.number().nullable(),
    notes: z.string().nullable(),
  }),
  demand: z.object({
    drivers: z.array(z.string()),
    notes: z.string().nullable(),
  }),
  citations: z.array(z.object({
    title: z.string(),
    url: z.string(),
    domain: z.string(),
  })),
});

const HtmlDeltaSchema = z.object({
  html: z.string(),
  delta_psqm: z.number().nullable().optional(),
});

const webSearchPreview = webSearchTool({
  searchContextSize: 'low',
  userLocation: { type: 'approximate' },
});

// ⚡ Research auf gpt-4o (2-3x schneller als GPT-5 Nano!)
const research = new Agent({
  name: 'Research',
  instructions: `Ermittle Marktdaten für die Immobilie. Sei präzise und fokussiert.

LOCATION: 
- Extrahiere aus payload.address: Postleitzahl, Stadtteil/Ortsteil, Gemeinde/Stadt
- Unterscheide: Großstadt, Kleinstadt, Gemeinde, Dorf
- Confidence-Level (niedrig/mittel/hoch)

BENCHMARKS:
- Bezirks-Median (€/m²) für Miete & Kaufpreis
- Preisspanne P25-P75 als {low, high} - falls nicht verfügbar: null setzen
- NUR diese 2 Ebenen, keine weiteren Segment-Aufschlüsselungen

LEERSTAND & NACHFRAGE:
- vacancy.risk (niedrig/mittel/hoch) + rate (% falls verfügbar, sonst null)
- demand.drivers: Max 3 konkrete Punkte zu Bewohnertypen & Beliebtheit

QUELLEN: Mietspiegel 2024/2025, Immobilienportale, amtliche Statistik. Min. 2 Quellen.

AUSGABE: Deutsch, strukturiert, nur Zahlen & kurze notes. Keine Fließtexte.`,
  model: 'gpt-4o', // ⚡ Gewechselt von gpt-5-nano (2-3x schneller!)
  tools: [webSearchPreview],
  outputType: ResearchSchema,
  modelSettings: { store: true },
});

// ✅ Lage Agent - Dynamisch basierend auf Stadt/Dorf/Gemeinde
const lageagent = new Agent({
  name: 'LageAgent',
  instructions: `Beschreibe die Lage in 4-5 Sätzen, Du-Anrede, investorenfreundlich.

INHALTE (nutze facts konkret):
- Ortstyp erkennbar machen (Großstadt/Kleinstadt/Gemeinde/Dorf/Ortsteil)
- Bewohnertypen aus facts.demand.drivers
- Charakter des Viertels (was gibt es dort)
- Infrastruktur & Verkehrsanbindung
- VERMIETBARKEIT: Wie schnell vermietbar? Begründung aus facts.demand
- LEERSTANDSRISIKO: facts.vacancy.risk mit konkreter Begründung (warum niedrig/mittel/hoch)

TONALITÄT anpassen an Ortsgröße:
- Urban/dynamisch bei Großstadt
- Ruhig/familienorientiert bei Kleinstadt/Gemeinde
- Ländlich/Natur bei Dorf

ZIEL: Nutzer soll Confidence für Investitionsentscheidung bekommen - sei konkret und begründe.

STIL: Du-Anrede, keine Preise/KPIs, natürlich formulieren.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, maxTokens: 600, store: true },
});


// ✅ Miet Agent - Dynamische Empfehlung basierend auf Vergleich
const mietagent = new Agent({
  name: 'MietAgent',
  instructions: `Vergleiche die Miete mit dem Markt in 2-3 Sätzen, Du-Anrede.

BERECHNE:
- Aktuelle Miete/m²: payload.miete / payload.flaeche
- Vergleich mit facts.rent.median_psqm
- Abweichung in Prozent

INHALTE:
- Nenne aktuelle Miete/m² und Markt-Median
- Erwähne Segment-Kontext (Zimmeranzahl, Größe)
- Falls facts.rent.range_psqm vorhanden: Nenne die Spanne
- Prozentuale Abweichung einordnen

LOGIK für Empfehlung:
- Miete deutlich unter Markt (>5%): Potenzial für Mieterhöhung ansprechen, Effekt auf Rendite/Cashflow
- Miete deutlich über Markt (>5%): Kann durch Ausstattung/Lage gerechtfertigt sein
- Miete im Marktniveau (±5%): Faire/marktgerechte Miete
- NUR bei Miete unter Markt: Optimierungstipp geben

STIL: Du-Anrede, konkret, keine Formeln, natürlich formulieren.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, maxTokens: 500, store: true },
});

// ✅ Kauf Agent - Dynamisch, Spanne nur wenn verfügbar
const kaufagent = new Agent({
  name: 'KaufAgent',
  instructions: `Vergleiche den Kaufpreis mit dem Markt in 2-3 Sätzen, Du-Anrede.

BERECHNE:
- Kaufpreis/m²: payload.kaufpreis / payload.flaeche
- Vergleich mit facts.price.median_psqm
- Abweichung in Prozent

INHALTE:
- Kaufpreis/m² und Markt-Median nennen
- Segment-Kontext (Objekttyp, Größe, Baujahr)
- Falls facts.price.range_psqm vorhanden: Spanne erwähnen (sonst weglassen)
- Prozentuale Abweichung

LOGIK für Empfehlung (nur EINE!):
- Deutlich unter Markt (<-10%): Sehr guter Preis, aber Zustand/Unterlagen prüfen (WEG-Rücklagen, Sanierungsbedarf)
- Deutlich über Markt (>+10%): Verhandlungsspielraum möglich, außer besondere Ausstattung/Lage
- Im Marktniveau (±10%): Fairer Preis

WICHTIG: Nicht widersprüchlich - entweder prüfen ODER verhandeln, nicht beides.

STIL: Du-Anrede, kein Markdown, keine CTAs, natürlich formulieren.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, maxTokens: 500, store: true },
});

// ✅ Invest Agent - Nutzt ECHTE KPIs aus der App
const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  instructions: `Schreibe kompakte Investment-Einschätzung in Du-Anrede. MAX 120 Wörter, 3 Absätze.

NUTZE DIESE DATEN:
- payload.cashflowVorSteuer, .nettoMietrendite, .bruttoMietrendite, .ekRendite, .dscr
- Ergebnisse aus lage.html, miete.html, kauf.html

STRUKTUR:

Absatz 1 - ZUSAMMENFASSUNG:
- Beginne mit einleitender Formulierung (z.B. "Zusammenfassend", "Insgesamt", "Im Überblick")
- Fasse Kernaussagen aus Lage/Miete/Kauf zusammen
- KEINE Zahlen wiederholen - nur Essenz

Absatz 2 - KPI-ANALYSE & OPTIMIERUNG:
- Analysiere die wichtigsten KPIs aus payload
- Bei negativem Cashflow: Thematisieren mit konkretem Wert
- Bei schwacher Rendite (<3%): Optimierungspotenzial aufzeigen
- Bei DSCR <1: Finanzierungsbedarf ansprechen
- Bei guten Werten: Bestätigen
- Verbinde mit Ergebnissen der anderen Agents (z.B. wenn Miete unter Markt + Rendite schwach → Mieterhöhung vorschlagen)
- Konkrete Optimierungstipps mit geschätztem Effekt

Absatz 3 - EMPFEHLUNG:
- Bewerte als: "Top-Investment" / "Solide mit Optimierungsbedarf" / "Risikobehaftet"
- Kriterien: Cashflow positiv, Rendite >3%, DSCR >1,2 = Top | 1-2 schwach = Solide | Mehrere schwach = Risikobehaftet
- Kurze Begründung mit 1-2 KPIs

WICHTIG: Nutze echte Werte aus payload, keine Wiederholungen aus anderen Agents.

STIL: Du-Anrede, analytisch, investorenfreundlich, natürlich formulieren.`,
  model: 'gpt-4o-mini',
  outputType: z.object({ html: z.string() }),
  modelSettings: { temperature: 0.4, maxTokens: 500, store: true },
});

export type AgentWorkflowResult = {
  facts: z.infer<typeof ResearchSchema>;
  lage: z.infer<typeof HtmlDeltaSchema>;
  miete: z.infer<typeof HtmlDeltaSchema>;
  kauf: z.infer<typeof HtmlDeltaSchema>;
  invest: { html: string };
};

export async function runWorkflow(
  workflow: WorkflowInput,
): Promise<AgentWorkflowResult> {
  const inputStr =
    typeof workflow.input_as_text === 'string'
      ? workflow.input_as_text
      : JSON.stringify(workflow.payload ?? {});

  let payload: unknown;
  try {
    payload = JSON.parse(inputStr);
  } catch (err) {
    throw new Error(`Konnte Input nicht parsen: ${err instanceof Error ? err.message : String(err)}`);
  }

  const runner = new Runner({
    traceMetadata: { __trace_source__: 'agent-builder', workflow_id: 'wf_local_in_app' },
  });

  // 1️⃣ Research (jetzt mit gpt-4o = 2-3x schneller!)
  const researchRes = await runner.run(research, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(payload) }] },
  ]);
  if (!researchRes.finalOutput) throw new Error('Research fehlgeschlagen');
  const facts = researchRes.finalOutput;

  // 2️⃣ Writer Agents PARALLEL
  const [lageRes, mietRes, kaufRes] = await Promise.all([
    runner.run(lageagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
    ]),
    runner.run(mietagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
    ]),
    runner.run(kaufagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
    ]),
  ]);

  if (!lageRes.finalOutput) throw new Error('Lage fehlgeschlagen');
  if (!mietRes.finalOutput) throw new Error('Miete fehlgeschlagen');
  if (!kaufRes.finalOutput) throw new Error('Kauf fehlgeschlagen');

  // 3️⃣ Invest Agent (bekommt ALLE Daten inkl. berechnete KPIs)
  const investRes = await runner.run(investitionsanalyseagent, [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify({
            payload, // Enthält jetzt auch die KPIs!
            facts,
            lage: lageRes.finalOutput,
            miete: mietRes.finalOutput,
            kauf: kaufRes.finalOutput,
          }),
        },
      ],
    },
  ]);
  if (!investRes.finalOutput) throw new Error('Investitionsanalyse fehlgeschlagen');

  return {
    facts,
    lage: lageRes.finalOutput,
    miete: mietRes.finalOutput,
    kauf: kaufRes.finalOutput,
    invest: investRes.finalOutput,
  };
}