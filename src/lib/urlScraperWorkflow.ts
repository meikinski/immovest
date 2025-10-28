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
  miete: z.number().nullable(), // Monatliche Kaltmiete
  hausgeld: z.number().nullable(), // Gesamt-Hausgeld
  hausgeld_umlegbar: z.number().nullable(), // Umlegbarer Anteil
  hausgeld_nicht_umlegbar: z.number().nullable(), // Nicht umlegbarer Anteil
  maklergebuehr: z.number().nullable(), // Maklergebühr in Euro oder Prozent
  objekttyp: z.enum(['wohnung', 'haus']).nullable(),
  confidence: z.enum(['niedrig', 'mittel', 'hoch']),
  notes: z.string().nullable(),
  warnings: z.array(z.string()), // Warnungen für User - immer Array (auch wenn leer)
});

// Web Search Tool mit medium context für bessere Ergebnisse
const webSearchForScraping = webSearchTool({
  searchContextSize: 'medium',
  userLocation: { type: 'approximate' },
});

// Scraper Agent der Web Search nutzt statt direktem Fetch
const scraperAgent = new Agent({
  name: 'ImmobilienScraper',
  instructions: `Du bist Immobilien-Daten-Extraktor. URL von Anzeige (ImmobilienScout24, Immowelt, etc.) → Extrahiere ALLE Daten via Web Search.

WAS EXTRAHIEREN:
1) Kaufpreis in Euro nur Zahl
2) Wohnfläche in m² nur Zahl
3) Anzahl Zimmer als Dezimal z.B. 3.5
4) Baujahr 4-stellig
5) Adresse vollständig Straße PLZ Stadt
6) Kaltmiete NUR MONATLICH - KRITISCH siehe unten
7) Hausgeld/Nebenkosten - KRITISCH siehe unten
8) Maklergebühr falls angegeben
9) Objekttyp - WICHTIG siehe unten

KRITISCH OBJEKTTYP:
- NUR diese Werte erlaubt: "wohnung" oder "haus"
- WENN Text sagt Wohnung, Eigentumswohnung, ETW → setze "wohnung"
- WENN Text sagt Haus, Einfamilienhaus, Mehrfamilienhaus, EFH, MFH → setze "haus"
- Standard bei Unsicherheit: "wohnung"

KRITISCH KALTMIETE vs HAUSGELD - NIEMALS VERWECHSELN:
- KALTMIETE = Was der Mieter als Miete zahlt (nicht Hausgeld!)
  * Suche nach: Kaltmiete, Nettokaltmiete, Grundmiete, monatliche Miete
  * NICHT: Hausgeld, Nebenkosten, Wohngeld, Betriebskosten
- HAUSGELD = Nebenkosten für Eigentümer (nicht Miete!)
  * Suche nach: Hausgeld, monatliches Hausgeld, Nebenkosten, Wohngeld, Betriebskosten
  * NICHT verwechseln mit Kaltmiete!
- WENN Miete steht und Text sagt JAHRESKALTMIETE oder Jahres-Kaltmiete oder ähnlich DANN teile durch 12 für monatliche Miete
- WENN Miete steht OHNE Hinweis auf Jahr DANN ist es monatlich übernimm direkt
- WENN unklar füge zu warnings hinzu: Miete evtl. Jahreswert bitte prüfen
- Setze miete = monatlicher Wert NIE Jahreswert

KRITISCH HAUSGELD/NEBENKOSTEN:
- Suche nach: Hausgeld, Nebenkosten, Wohngeld, Betriebskosten, monatliche Kosten (für Eigentümer)
- NIEMALS Kaltmiete als Hausgeld verwenden!
- WENN Hausgeld gefunden UND keine Aufteilung angegeben:
  * hausgeld = Gesamtbetrag
  * hausgeld_umlegbar = 60 Prozent von Gesamtbetrag
  * hausgeld_nicht_umlegbar = 40 Prozent von Gesamtbetrag
  * Füge zu warnings hinzu: Hausgeld-Verteilung ist Schätzung (60% umlegbar, 40% nicht umlegbar). Bitte nach Erhalt der WEG-Unterlagen genaue Werte eintragen.
- WENN Hausgeld MIT Aufteilung angegeben übernimm die Werte
- WENN Hausgeld NICHT gefunden setze alle auf NULL

MAKLERGEBÜHR - IMMER PROZENTSATZ PRÜFEN:
- Kann sein: 3,57 Prozent, 7 Prozent Provision, 10.000 Euro, provisionsfrei
- WENN provisionsfrei DANN maklergebuehr = 0
- WENN Prozent angegeben UND Kaufpreis vorhanden:
  * Berechne Euro-Betrag: maklergebuehr = Kaufpreis * (Prozent / 100)
  * Dokumentiere in notes: Maklergebühr X% = Y Euro (berechnet)
- WENN Prozent angegeben ABER Kaufpreis fehlt:
  * Setze maklergebuehr = NULL
  * Füge zu warnings hinzu: Maklergebühr X% bekannt - Betrag wird nach Eingabe des Kaufpreises berechnet
  * Dokumentiere Prozentsatz in notes: Maklergebühr X% (noch nicht berechnet)
- WENN Euro-Betrag DANN übernimm und dokumentiere in notes
- IMMER prüfen ob Maklergebühr vorhanden ist

CONFIDENCE:
- hoch: Kaufpreis Fläche Zimmer Adresse alle da
- mittel: Kaufpreis Fläche da aber Rest fehlt teilweise
- niedrig: wichtige Daten fehlen

NOTES STRUKTUR:
Kaufpreis X Euro, Y m², Z Zimmer, Baujahr YYYY, Adresse gefunden. Kaltmiete X Euro monatlich. Hausgeld X Euro (Default-Verteilung angewendet). Makler: provisionsfrei.

WARNINGS FÜR USER (Array - IMMER zurückgeben, auch wenn leer):
Nur hinzufügen wenn relevant z.B.:
- Hausgeld-Verteilung ist Schätzung (60% umlegbar, 40% nicht umlegbar). Bitte nach Erhalt der WEG-Unterlagen genaue Werte eintragen.
- Miete evtl. Jahreswert bitte prüfen
WENN keine Warnungen DANN leeres Array []

ABSOLUTE REGEL: Nur Daten aus Quelle. KEINE Schätzungen außer Hausgeld-Verteilung mit warning.`,
  model: 'gpt-4o-mini',
  tools: [webSearchForScraping],
  outputType: ImmobilienDataSchema,
  modelSettings: {
    store: true,
    temperature: 0.05  // Sehr niedrig für konsistente Extraktion
  },
});

export type UrlScraperResult = z.infer<typeof ImmobilienDataSchema>;

export async function runUrlScraper(input: UrlScraperInput): Promise<UrlScraperResult> {
  if (!input.url) {
    throw new Error('URL ist erforderlich');
  }

  // Validate URL (lenient - just check basic format)
  const trimmedUrl = input.url.trim();
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new Error('URL muss mit http:// oder https:// beginnen');
  }

  // Try parsing, but don't fail on fragments or complex query params
  try {
    new URL(trimmedUrl);
  } catch (err) {
    console.warn('[URL Scraper] URL parse warning (proceeding anyway):', err);
    // Continue anyway - web search tool might handle it
  }

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: 'url-scraper',
      workflow_id: 'wf_url_scraper'
    },
  });

  console.log(`[URL Scraper] Starting for: ${trimmedUrl}`);

  const result = await runner.run(scraperAgent, [
    {
      role: 'user',
      content: [{
        type: 'input_text',
        text: `Extrahiere Immobilien-Daten von dieser URL: ${trimmedUrl}`
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
