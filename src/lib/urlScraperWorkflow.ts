// src/lib/urlScraperWorkflow.ts
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';

export type UrlScraperInput = {
  url: string;
};

// Output Schema für Immobilien-Daten
const ImmobilienDataSchema = z.object({
  kaufpreis: z.number().nullable(),
  flaeche: z.number().nullable(),
  zimmer: z.number().nullable(),
  baujahr: z.number().nullable(),
  adresse: z.string().nullable(),
  miete: z.number().nullable(),
  objekttyp: z.enum(['wohnung', 'haus']).nullable(),
  confidence: z.enum(['niedrig', 'mittel', 'hoch']),
  notes: z.string().nullable(),
});

// Web Search Tool mit medium context für bessere Ergebnisse
const webSearchForScraping = webSearchTool({
  searchContextSize: 'medium',
  userLocation: { type: 'approximate' },
});

// Scraper Agent der Web Search nutzt statt direktem Fetch
const scraperAgent = new Agent({
  name: 'ImmobilienScraper',
  instructions: `Du bist ein Immobilien-Daten-Extraktor. Du bekommst eine URL zu einer Immobilien-Anzeige (ImmobilienScout24, Immowelt, etc.).

AUFGABE: Extrahiere ALLE verfügbaren Daten aus der Anzeige via Web Search.

WAS EXTRAHIEREN:
1) Kaufpreis in Euro (nur die Zahl, ohne Währung)
2) Wohnfläche in m² (nur die Zahl)
3) Anzahl Zimmer (als Dezimalzahl, z.B. 3.5)
4) Baujahr (4-stellige Jahreszahl)
5) Vollständige Adresse (Straße, PLZ, Stadt)
6) Kaltmiete falls angegeben (nur die Zahl)
7) Objekttyp: "wohnung" oder "haus"

WICHTIG:
- Nutze Web Search um die URL-Inhalte zu finden
- Wenn eine Info NICHT gefunden wird, setze NULL
- NIEMALS schätzen oder erfinden
- Dokumentiere in notes was gefunden/nicht gefunden wurde
- confidence: "hoch" wenn alle Hauptdaten da sind, "mittel" wenn teilweise, "niedrig" wenn wenig

BEISPIEL GUTE NOTES:
"Kaufpreis 350.000 Euro, 85 m², 3 Zimmer, Baujahr 2015, Adresse vollständig gefunden. Keine Mietangabe in Anzeige."

BEISPIEL SCHLECHTE NOTES:
"Daten extrahiert" (zu vage)

ABSOLUTE REGEL: Nur Daten die in der Quelle stehen, keine Schätzungen.`,
  model: 'gpt-4o-mini',
  tools: [webSearchForScraping],
  outputType: ImmobilienDataSchema,
  modelSettings: {
    store: true,
    temperature: 0.1  // Sehr niedrig für konsistente Extraktion
  },
});

export type UrlScraperResult = z.infer<typeof ImmobilienDataSchema>;

export async function runUrlScraper(input: UrlScraperInput): Promise<UrlScraperResult> {
  if (!input.url) {
    throw new Error('URL ist erforderlich');
  }

  // Validate URL
  try {
    new URL(input.url);
  } catch {
    throw new Error('Ungültige URL');
  }

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: 'url-scraper',
      workflow_id: 'wf_url_scraper'
    },
  });

  console.log(`[URL Scraper] Starting for: ${input.url}`);

  const result = await runner.run(scraperAgent, [
    {
      role: 'user',
      content: [{
        type: 'input_text',
        text: `Extrahiere Immobilien-Daten von dieser URL: ${input.url}`
      }]
    },
  ]);

  if (!result.finalOutput) {
    throw new Error('URL Scraping fehlgeschlagen - keine Daten extrahiert');
  }

  console.log('[URL Scraper] Complete:', {
    kaufpreis: result.finalOutput.kaufpreis,
    flaeche: result.finalOutput.flaeche,
    confidence: result.finalOutput.confidence,
  });

  return result.finalOutput;
}
