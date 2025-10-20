// src/lib/agentWorkflow.ts
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';

// 1) Wir lassen den Agenten sowohl einen JSON-String (input_as_text)
//    als auch ein Objekt (payload) akzeptieren. Mindestens eines muss gesetzt sein.
export type WorkflowInput = {
  input_as_text?: string;
  payload?: unknown;
};

// 2) Starke Schemas: Range als Objekt {low, high} – kein Tuple → verhindert Schemafehler
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

// 3) Tool und Agents (Ihre Instruktionen hier unverändert einsetzen)
const webSearchPreview = webSearchTool({
  searchContextSize: 'medium',
  userLocation: { type: 'approximate' },
});
const research = new Agent({
  name: 'Research',
  instructions: `Standort normalisieren: Nutze payload.address (vorab per JSON.parse(payload) aus dem String extrahieren), um Postleitzahl und Stadtteil zu bestimmen. Greife hierfür auf mindestens drei zuverlässige Quellen zurück (z. B. offizielle Stadtpläne, kommunale Geo-Services, amtliche Portale), damit die Einordnung sicher ist. Fülle das Feld location mit postal_code, district, confidence (hoch/mittel/niedrig) und einer kurzen Notiz, warum die Zuordnung evtl. unsicher ist („Straßenname mehrfach vorhanden → auf Stadtebene aggregiert“).
Quartiersportraits berücksichtigen: Ergänze die reine Miet‑ und Kaufpreisrecherche durch Porträts und Beschreibungen des Viertels (Stadtportale, Tourismus‑Seiten, lokale Medien). Solche Artikel beschreiben, ob ein Viertel als jung, hip und kreativ gilt, welche Boutiquen, Cafés und Bars es bietet und welche Bewohnergruppen dort lebencologne-tourism.comcityinfo-koeln.de. Sammle die Kernaussagen in demand.drivers oder – falls sie das Leerstandsrisiko betreffen – in vacancy.notes.
Benchmarks ermitteln: Ermittele für KALTMIETE und KAUFPREIS jeweils drei Ebenen:
Stadt (city_median_psqm),
Stadtteil/Bezirk (district_median_psqm),
Segment passend zum Objekt: object_type (Wohnung/Haus), rooms_bucket (z. B. „2 Zimmer“), size_bucket (z. B. „55–65 m²“), year_bucket (Baujahr-Spanne). Liefere segment_median_psqm und segment_range_psqm [low, high]. Nutze dazu aktuelle Mietspiegel (2025 oder jünger), amtliche Marktberichte, Gutachterausschussdaten und seriöse Immobilienportale mit transparenter Methodik.
Fallbacks: Falls für eine Ebene (insbesondere das Segment) keine offiziellen Daten vorliegen, setze das entsprechende Feld auf null und erkläre in notes, auf welche Ebene du stattdessen ausgewichen bist („Segment nicht verfügbar – Bezirk gesamt verwendet“).
QUELLEN
Priorisiere Immobilienportale, aktuelle Mietspiegel und Wohnungsmarktberichte (Jahr 2025 oder jünger), amtliche Statistik und Gutachterausschüsse. Große Portale mit offener Methodik sind als Ergänzung zulässig.
Verwende mindestens zwei unabhängige Quellen je Kennzahl. Verwende keine „Straßenanalysen“ ohne transparente Methodik.
Vermeide Quellen, die älter als 2025 sind. Beschreibe Quellen nicht im Text; gib sie ausschließlich im Feld citations an (Titel, URL, Domain).
AUSGABE
Gib das Ergebnis auf Deutsch zurück; verwende Dezimal-Komma. Halte dich strikt an das vorgegebene Structured‑Output‑Schema (location, rent, price, vacancy, demand, citations). Schreibe keine Fließtexte außerhalb der dafür vorgesehenen Felder.
HINWEIS
Der Inhalt von payload wird als JSON‑String übergeben. Parsen Sie ihn zu einem Objekt (z. B. const data = JSON.parse(payload)), bevor Sie darauf zugreifen. Gehe defensiv mit fehlenden Feldern um und lass sie leer oder auf null, wenn keine Angaben gemacht wurden.`,
  model: 'gpt-5-nano-2025-08-07',
  tools: [webSearchPreview],
  outputType: ResearchSchema,
  modelSettings: { reasoning: { effort: 'medium', summary: 'auto' }, store: true },
});
const lageagent = new Agent({
  name: 'LageAgent',
  instructions: `Lage‑Agent
Fokus: Beschreibe nur die Lage, ohne Preise oder KPIs zu erwähnen.
Tonalität: Sprich den Nutzer in der Du‑Form an und verwende einen investorenorientierten, aber natürlichen Stil.
Inhalt:
Wer wohnt hier? Beschreibe typische Bewohnergruppen (z. B. „junge Berufstätige, kreative Paare“) und den Charakter des Viertels (anhand von Boutiquen, Cafés, Nachtleben, Restaurants, Ausgehmöglichkeiten usw. ).
Warum ist die Lage beliebt oder weniger beliebt? Nenne Verkehrs­anbindung, Freizeitangebot und Infrastruktur.
Vermietbarkeit: Erkläre, ob man mit schneller Vermietung rechnen kann und wie hoch das Leerstandsrisiko ist.
Hinweis bei location.confidence ≠ "hoch", dass die Einschätzung auf Bezirksebene basiert.
Nicht wiederholen: Verzichte auf Objekt-, Preis- oder KPI‑Angaben – diese kommen in anderen Agenten.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, topP: 1, maxTokens: 1200, store: true },
});
const mietagent = new Agent({
  name: 'MietAgent',
  instructions: `Fokus: Vergleich der aktuellen Miete mit dem Markt.
Inhalt:
Nenne einmal den Benchmark für die Miete (Segment‑Median, oder Bezirk/ Stadt).
Vergleiche diesen Benchmark mit payload.currentRents.psqm, gib die prozentuale Abweichung an ohne Berechnungsformel.
Ordne die Abweichung ein: „liegt X % unter dem Markt – Potenzial für Mieterhöhung“ oder „liegt über dem Markt – Miete eventuell gerechtfertigt durch gute Ausstattung“.
Erkläre, dass eine Mieterhöhung vor allem die Netto‑Rendite und den Cashflow verbessert – nicht die Wettbewerbsfähigkeit.
Keine Wiederholung: Die Lagebeschreibung oder Adresse sollte hier nicht noch einmal auftauchen.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, topP: 1, maxTokens: 1200, store: true },
});
const kaufagent = new Agent({
  name: 'KaufAgent',
  instructions: `Fokus: Bewertung des Kaufpreises pro m² im Vergleich zum Markt.
Inhalt:
Nenne den Benchmark für den Kaufpreis (Bezirk und Segment).
Vergleiche ihn mit dem Objektpreis aus payload.askingPrice.psqm und formuliere die Differenz in Prozent.
Bei deutlicher Unterbewertung: Betone, dass dies ein sehr guter Preis ist, und rate, den Zustand und die Unterlagen (WEG‑Rücklagen, Baurecht, Sanierungsbedarf) zu prüfen statt zu verhandeln.
Bei Überbewertung: Weise auf möglichen Verhandlungsspielraum hin und nenne Gründe, die einen Aufschlag rechtfertigen könnten.
Wortwahl: Vermeide den Begriff „Abschlag“; sprich lieber von „günstigem Preis“ oder „unter dem Marktpreis“.`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.3, topP: 1, maxTokens: 1200, store: true },
});
const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  instructions: `Fokus: Ganzheitliche Einordnung der Lage‑, Miet‑ und Kauf‑Ergebnisse und der KPIs.
Inhalt:
Fasse die Kernaussagen der drei Writer‑Agenten zusammen, ohne Details zu wiederholen.
Erkläre die KPIs kurz:
Netto‑Mietrendite (Mieteinnahmen nach Kosten dividiert durch Kaufpreis) und Brutto‑Mietrendite (Mieteinnahmen vor Kosten),
Cashflow (monatlicher Überschuss),
DSCR (Verhältnis von Nettoeinnahmen zu Kreditrate) und
Eigenkapital‑Rendite. Ordne die vorliegenden Werte ein („4 % Netto‑Rendite → solide; DSCR 1,2 → gute Schuldendienstdeckung“).
Verbesserungsmöglichkeiten in Alltagssprache: Mietanpassung auf Marktniveau, Modernisierung von Bad/Küche, Hausgeld/Betriebskosten optimieren, Eigenkapital erhöhen oder Zinsbindung anpassen.
Wenn der Kaufpreis bereits klar unter dem Markt liegt, erwähne keine Preisverhandlung – konzentriere dich auf den Vorteil und die Prüfung von Zustand/Unterlagen.
Schließe mit einer klaren Empfehlung („Top‑Investment“, „solide mit Vorbehalt“, „risikobehaftet“) und einer kurzen Begründung.`,
  model: 'gpt-5-nano-2025-08-07',
  // Liefere ein Objekt mit html-Feld zurück
  outputType: z.object({ html: z.string() }),
  modelSettings: { reasoning: { effort: 'medium', summary: 'auto' }, store: true },
});

// 4) Ergebnis-Typ: facts (Research), Lage, Miete, Kauf, Invest
export type AgentWorkflowResult = {
  facts: z.infer<typeof ResearchSchema>;
  lage: z.infer<typeof HtmlDeltaSchema>;
  miete: z.infer<typeof HtmlDeltaSchema>;
  kauf: z.infer<typeof HtmlDeltaSchema>;
  invest: { html: string };
};

// 5) Hauptworkflow: Parsen + Agents sequenziell ausführen
export async function runWorkflow(
  workflow: WorkflowInput,
): Promise<AgentWorkflowResult> {
  // Payload ermitteln: string oder Objekt
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

  // Research
  const researchRes = await runner.run(research, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(payload) }] },
  ]);
  if (!researchRes.finalOutput) throw new Error('Research fehlgeschlagen');
  const facts = researchRes.finalOutput;

  // Lage
  const lageRes = await runner.run(lageagent, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
  ]);
  if (!lageRes.finalOutput) throw new Error('Lage fehlgeschlagen');

  // Miete
  const mietRes = await runner.run(mietagent, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
  ]);
  if (!mietRes.finalOutput) throw new Error('Miete fehlgeschlagen');

  // Kauf
  const kaufRes = await runner.run(kaufagent, [
    { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ payload, facts }) }] },
  ]);
  if (!kaufRes.finalOutput) throw new Error('Kauf fehlgeschlagen');

  // Invest
  const investRes = await runner.run(investitionsanalyseagent, [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: JSON.stringify({
            payload,
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
