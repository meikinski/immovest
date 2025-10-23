// src/lib/agentWorkflow.ts - ALLE STRINGS EINZEILIG
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

const research = new Agent({
  name: 'Research',
  instructions: 'Du bist Marktforscher. ABSOLUTE REGEL: Wenn Zahl NICHT in Quelle gefunden, setze NULL. NIEMALS schaetzen oder erfinden. Extrahiere aus payload: PLZ, Stadtteil, Stadt, objektTyp, zimmer, flaeche, baujahr. Diese Infos MUESSEN in rent.notes und price.notes dokumentiert werden. Benchmarks: 1) Gemeinde-Median Euro/qm MUSS aus Quelle, 2) Optional Segment-Median fuer aehnliche Objekte, 3) Preisspanne P25-P75 wenn verfuegbar, 4) Quelle plus Jahr plus Segmentierung in notes. Leerstand KRITISCH: vacancy.risk NUR wenn Quelle gefunden sonst NULL, vacancy.rate NUR wenn konkreter Prozent-Wert in Quelle sonst NULL, vacancy.notes GENAU dokumentieren was gefunden (Beispiel RICHTIG: Keine spezifischen Leerstandsdaten fuer Wettenberg gefunden, Landkreis Giessen 1,2 Prozent laut Statistik Hessen 2024 nur indikativ NICHT spezifisch fuer Gemeinde, Beispiel FALSCH: Leerstandsquote liegt bei 2,5 Prozent wenn nicht in Quelle). demand.drivers NUR aus Quellen. WENN KEINE DATEN: Lieber ehrlich Keine Daten gefunden als schaetzen. Quellen: Mietspiegel 2024/2025, Gutachterausschuss, Wohnungsmarktberichte, Immobilienportale nur ergaenzend. VERBOTEN: Schaetzungen wie etwa circa ungefaehr, Zahlen ohne Quellenangabe, Uebertragung von Kreis-Daten auf Gemeinde ohne Kennzeichnung, Erfindung von Segment-Daten.',
  model: 'gpt-4o-mini',
  tools: [webSearchPreview],
  outputType: ResearchSchema,
  modelSettings: { store: true, temperature: 0.05 },
});

const lageagent = new Agent({
  name: 'LageAgent',
  instructions: 'Beschreibe Lage wie Investor einem Freund sachlich aber locker. Nutze AUSSCHLIESSLICH facts. 4-5 Saetze: 1) FUER WEN INTERESSANT: Die Wohnung ist vor allem fuer Zielgruppe interessant, nutze NUR facts.demand.drivers KEINE eigenen Erfindungen. 2) WARUM: Erklaere WARUM aber NUR wenn in facts.demand.notes erwaehnt, wenn NICHTS in notes dann Die Lage bietet generische Vorteile fuer Zielgruppen. 3) NACHFRAGE-KONTEXT aus facts.location: Kleinstadt/Gemeinde bedeutet oft stabilere Mieter aber kleineren Pool an Interessenten, Grossstadt bedeutet grossen Pool aber mehr Fluktuation. 4) LEERSTANDSRISIKO NUR aus facts.vacancy, PRUEFE GENAU facts.vacancy.notes, WENN vacancy.rate ist NULL UND notes enthaelt Keine spezifischen Daten dann Konkrete Leerstandszahlen fuer Ort gibt es nicht, WENN vacancy.rate ist NUMBER UND notes enthaelt Landkreis ODER Region ODER indikativ dann Fuer Gemeinde selbst gibt es keine genauen Zahlen der Landkreis/Region liegt bei etwa X Prozent das ist aber nur grobe Richtung, WENN vacancy.rate ist NUMBER UND notes enthaelt NICHT indikativ ODER Landkreis dann Der Leerstand in Ort liegt bei X Prozent. 5) VERMIETBARKEIT KRITISCH KEINE Zeitangaben wie 2-3 Monate erfinden, basiere NUR auf facts.vacancy.risk: niedrig bedeutet Vermietung sollte zuegig klappen, mittel bedeutet Vermietung sollte machbar sein, hoch bedeutet Vermietung koennte laenger dauern, NULL bedeutet Zur Vermietungsdauer gibt es keine belastbaren Daten. VERBOTEN: Zeitangaben wie 2-3 Monate ohne Quelle, Leerstandszahlen ohne Quelle, POIs die nicht in facts stehen, Aussagen ueber Anbindung ohne facts. TON: Lockerer Experten-Ton ehrlich bei fehlenden Daten.',
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.25, maxTokens: 600, store: true },
});

const mietagent = new Agent({
  name: 'MietAgent',
  instructions: 'Vergleiche Miete mit Markt wie dein Kumpel der sich auskennt. Nutze facts.rent. Berechne: Aktuelle Miete/qm vs facts.rent.median_psqm, Abweichung in Prozent. STRUKTUR 2-3 Saetze FLIESSTEXT: Die 3-Zimmer-Wohnung 67 qm wird fuer 14,93 Euro/qm vermietet. In Wettenberg liegt der Schnitt bei 10,34 Euro/qm, vergleichbare 3-Zimmer-Wohnungen 60-80 qm kosten im Median etwa 10,32 Euro/qm die uebliche Spanne geht von 10 bis 10,50 Euro. Du liegst also 44 Prozent drueber was nur durch richtig gute Ausstattung oder Top-Mikrolage zu rechtfertigen waere. WICHTIG: Spanne NATUERLICH in Satz einbauen nicht als Extra-Zeile, Segment-Median in gleichen Satz wie Gemeinde-Median, Du liegst X Prozent drueber/drunter statt Das ist X Prozent, Keine Aufzaehlungen nur Fliesstext. TONFALL: Wie beim Bier erklaeren locker direkt auf den Punkt.',
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.35, maxTokens: 450, store: true },
});

const kaufagent = new Agent({
  name: 'KaufAgent',
  instructions: 'Vergleiche Kaufpreis wie dein Kumpel der sich auskennt. Nutze facts.price. Berechne: Kaufpreis/qm vs facts.price.median_psqm, Abweichung in Prozent. WICHTIG BEI ANZEIGE: Wenn Zahl in Tausender (z.B. 2985 Euro/qm) schreibe 2.985 Euro/qm MIT Punkt, wenn Zahl unter Tausend keine besondere Formatierung. STRUKTUR 2-3 Saetze FLIESSTEXT: Fuer die 3-Zimmer-Wohnung 67 qm Baujahr 1900 werden 2.985 Euro/qm aufgerufen. In Wettenberg liegt der Schnitt bei 3.280 Euro/qm, vergleichbare Altbau-Wohnungen mit 3 Zimmern kosten im Median etwa 3.100 Euro/qm ueblich sind 3.000 bis 3.600 Euro. Du liegst 9 Prozent drunter das ist ein fairer bis guter Preis schau dir aber unbedingt die WEG-Unterlagen an (Protokolle Ruecklagen anstehende Sanierungen). WICHTIG: Spanne NATUERLICH einbauen, Segment-Median in gleichen Satz, Du liegst X Prozent drueber/drunter, Bei gutem Preis Zustand pruefen, Bei teurem Preis Verhandlung. TONFALL: Wie beim Bier locker direkt.',
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.35, maxTokens: 450, store: true },
});

const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  instructions: 'Du erklaerst deinem Kumpel das Investment klar ehrlich ohne Zahlensalat. ZIEL: Was muss ich wissen, was ist das Risiko, was soll ich tun. 4 ABSAETZE 120-150 Woerter: ABSATZ 1 FUER WEN 20-25 Woerter: Aus lage.html Zielgruppen plus ob Nachfrage gut/mittel/schlecht. Die Wohnung passt fuer Zielgruppe, 1 Satz zur Nachfrage. ABSATZ 2 DIE ZAHLEN 30-40 Woerter: Ueberschrift Die Zahlen im Ueberblick. NUR die 3 wichtigsten KPIs: Cashflow von 265 Euro im Monat das laeuft solide, Rendite von 4,8 Prozent stark, Die Rate ist gut gedeckt DSCR 1,47. KEINE Detail-Zahlen wie EK Kaufpreis Anschaffungskosten zu viel Ballast. ABSATZ 3 DAS RISIKO 40-50 Woerter: Ueberschrift Hier ist der Haken. NUR DAS groesste Risiko OHNE Zahlen-Overkill. Die Miete liegt 44 Prozent ueber dem Markt 1000 statt ca 700 Euro. Problem Bei Mieterwechsel kriegst du keinen Nachmieter zu diesem Preis. Worst Case bei Markt-Miete Du zahlst jeden Monat drauf Rendite faellt auf ca 3 Prozent. Mittlerer Weg mit 750 Euro Gerade so plus-minus null. ABSATZ 4 WAS TUN 30-40 Woerter: Ueberschrift Meine Empfehlung. Max 2 Schritte KONKRET. 1) Kaufpreis ist gut WEG-Unterlagen checken Protokolle Ruecklagen Sanierungen. 2) Aktuellen Mieter halten oder bei Neuvermietung realistisch 11-12 Euro/qm ansetzen. ZUSAMMENFASSUNG 10-15 Woerter: Ja mit Vorbehalt Starker Cashflow und Rendite aber Miete deutlich ueber Markt. VERBOTEN: Zahlen wie EK 100000 Euro Kaufpreis 200000 Euro Anschaffungskosten 224140 Euro. Wiederholung von Zahlen aus miete/kauf. Mehr als 3 KPIs im Zahlen-Teil. Formeln oder Berechnungen zeigen. TONFALL: Wie beim Bier erklaeren direkt klar ohne Schnickschnack',
  model: 'gpt-5-mini',
  outputType: z.object({ html: z.string() }),
  modelSettings: { 
    reasoning: { effort: 'low', summary: 'auto' },
    store: true 
  },
});

export type AgentWorkflowResult = {
  facts: z.infer<typeof ResearchSchema>;
  lage: z.infer<typeof HtmlDeltaSchema>;
  miete: z.infer<typeof HtmlDeltaSchema>;
  kauf: z.infer<typeof HtmlDeltaSchema>;
  invest: { html: string };
};

export async function runWorkflow(workflow: WorkflowInput): Promise<AgentWorkflowResult> {
  const inputStr = typeof workflow.input_as_text === 'string'
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

  console.log('Research Agent starting...');
  const researchRes = await runner.run(research, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(payload) }] },
  ]);
  if (!researchRes.finalOutput) throw new Error('Research fehlgeschlagen');
  const facts = researchRes.finalOutput;
  
  if (!facts.rent.median_psqm && !facts.price.median_psqm) {
    console.warn('Research hat keine Median-Werte geliefert');
  }
  console.log('Research complete:', {
    rent_median: facts.rent.median_psqm,
    price_median: facts.price.median_psqm,
    vacancy_rate: facts.vacancy.rate,
    citations: facts.citations.length
  });

  console.log('Writer Agents starting...');
  const writerContext = {
    payload,
    facts: {
      location: facts.location,
      rent: facts.rent,
      price: facts.price,
      vacancy: facts.vacancy,
      demand: facts.demand,
    }
  };
  
  const [lageRes, mietRes, kaufRes] = await Promise.all([
    runner.run(lageagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(writerContext) }] },
    ]),
    runner.run(mietagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(writerContext) }] },
    ]),
    runner.run(kaufagent, [
      { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(writerContext) }] },
    ]),
  ]);

  if (!lageRes.finalOutput) throw new Error('Lage fehlgeschlagen');
  if (!mietRes.finalOutput) throw new Error('Miete fehlgeschlagen');
  if (!kaufRes.finalOutput) throw new Error('Kauf fehlgeschlagen');
  
  console.log('Writer Agents complete');

  console.log('Invest Agent starting...');
  const investRes = await runner.run(investitionsanalyseagent, [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify({
            payload,
            facts: writerContext.facts,
            lage: lageRes.finalOutput,
            miete: mietRes.finalOutput,
            kauf: kaufRes.finalOutput,
          }),
        },
      ],
    },
  ]);
  if (!investRes.finalOutput) throw new Error('Investitionsanalyse fehlgeschlagen');
  console.log('Invest Agent complete');

  return {
    facts,
    lage: lageRes.finalOutput,
    miete: mietRes.finalOutput,
    kauf: kaufRes.finalOutput,
    invest: investRes.finalOutput,
  };
}