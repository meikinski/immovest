// src/lib/urlScraperWorkflow.ts
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';
import { smartProxyFetch } from './smartProxy';

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
  miete: z.number().nullable(), // Monatliche Kaltmiete (bei MFH: Summe aller Einheiten)
  hausgeld: z.number().nullable(), // Gesamt-Hausgeld (nur bei ETW)
  hausgeld_umlegbar: z.number().nullable(), // Umlegbarer Anteil (bei ETW) oder Nebenkosten umlagbar (bei Haus/MFH)
  hausgeld_nicht_umlegbar: z.number().nullable(), // Nicht umlegbarer Anteil (bei ETW) oder Verwaltungskosten (bei Haus/MFH)
  maklergebuehr: z.number().nullable(), // Maklergebühr in Prozent (z.B. 3.57 für 3,57%)
  objekttyp: z.enum(['wohnung', 'haus', 'mfh']).nullable(),
  anzahl_wohneinheiten: z.number().nullable(), // Anzahl Wohneinheiten (nur bei MFH)
  confidence: z.enum(['niedrig', 'mittel', 'hoch']),
  notes: z.string().nullable(),
  warnings: z.array(z.string()), // Warnungen für User - immer Array (auch wenn leer)
});

// Web Search Tool mit medium context für bessere Ergebnisse
const webSearchForScraping = webSearchTool({
  searchContextSize: 'medium',
  userLocation: { type: 'approximate' },
});

// Scraper Agent for web search tool (primary method)
const scraperAgent = new Agent({
  name: 'ImmobilienScraper',
  instructions: `Du extrahierst Daten aus Immobilien-Anzeigen (ImmobilienScout24, Immowelt, Kleinanzeigen, eBay Kleinanzeigen, etc.).

🚨🚨🚨 SCHRITT 1 - PROVISION ZUERST SUCHEN! 🚨🚨🚨

BEVOR du IRGENDWELCHE anderen Daten extrahierst, MUSST du nach der Käuferprovision suchen!
Die Provision wird STÄNDIG übersehen - das ist INAKZEPTABEL!

SUCH-STRATEGIE für Provision:
1. Lade die GESAMTE Seite mit dem Web Search Tool
2. Suche nach diesen EXAKTEN Textmustern:
   - "Provision für Käufer"
   - "Käuferprovision beträgt"
   - "Käuferprovision"
   - "Provision beträgt"
   - "Provision:"
   - "Maklergebühr"
   - "Courtage"
3. Wenn du IRGENDEINEN dieser Texte findest, extrahiere den Prozentsatz!

BEISPIELE die du finden MUSST:
- "Käuferprovision beträgt 3,0 % (inkl. MwSt.)" → maklergebuehr = 3.0
- "Provision für Käufer: 3,57%" → maklergebuehr = 3.57
- "Provision: 2,38% inkl. MwSt." → maklergebuehr = 2.38
- "provisionsfrei" → maklergebuehr = 0

🔴 WICHTIG:
- Speichere NUR den Prozentsatz (3.0, 3.57, etc.)
- NICHT den Euro-Betrag!
- Wenn du "3,57%" findest → maklergebuehr = 3.57
- Komma durch Punkt ersetzen!
- Falls GAR NICHTS über Provision → maklergebuehr = null

Nach dieser PROVISIONS-SUCHE, extrahiere die anderen Daten:

🔴 KRITISCH - Kaltmiete vs Hausgeld verstehen:

In deutschen Immobilien-Anzeigen gibt es zwei VERSCHIEDENE monatliche Beträge:

1) KALTMIETE = Miete die der Mieter zahlt (Einnahmen für Eigentümer)
   - Wird genannt: "Kaltmiete", "Nettokaltmiete", "Grundmiete", "Kalt-Miete"
   - Typisch: 600-2000€ pro Monat
   - Beispiel im Inserat: "Kaltmiete: 950,00 €"
   - → Extrahiere diesen Wert ins Feld "miete"

2) HAUSGELD = Nebenkosten die der Eigentümer zahlt (Ausgaben)
   - Wird genannt: "Hausgeld", "monatliches Hausgeld", "Wohngeld"
   - Typisch: 150-400€ pro Monat
   - Beispiel im Inserat: "Hausgeld: 245,00 €"
   - → Extrahiere diesen Wert ins Feld "hausgeld"

WICHTIG: Das sind ZWEI VERSCHIEDENE Werte!
- Wenn du "Kaltmiete: 950€" siehst → miete = 950, NICHT hausgeld!
- Wenn du "Hausgeld: 245€" siehst → hausgeld = 245, NICHT miete!
- Kaltmiete ist IMMER höher als Hausgeld!

📋 BEISPIEL-EXTRAKTION:

Aus einem Inserat mit folgendem Text:
"Kaufpreis: 350.000 €
Wohnfläche: 75 m²
Zimmer: 3
Kaltmiete: 950 €
Hausgeld: 245 €
Käuferprovision: 3,57% inkl. MwSt."

RICHTIGE Extraktion:
{
  kaufpreis: 350000,
  flaeche: 75,
  zimmer: 3,
  miete: 950,          ← Die GRÖSSERE Zahl (Kaltmiete)
  hausgeld: 245,       ← Die KLEINERE Zahl (Hausgeld)
  maklergebuehr: 3.57  ← Prozentsatz als Zahl (aus "3,57% inkl. MwSt.")
}

FALSCH wäre:
- miete: 245 (das ist Hausgeld!)
- hausgeld: 950 (das ist Kaltmiete!)
- miete: null und hausgeld: 950 (beide Werte verwechselt!)
- maklergebuehr: 12495 (NICHT den Euro-Betrag berechnen, nur Prozent!)
- maklergebuehr: null (wenn Prozent im Text steht!)

DATEN EXTRAHIEREN:

1) KAUFPREIS:
   - Suche: "Kaufpreis", "Preis"
   - Nur die Zahl (z.B. 350000)

2) WOHNFLÄCHE:
   - Suche: "Wohnfläche", "m²"
   - Nur die Zahl (z.B. 75)

3) ZIMMER:
   - Suche: "Zimmer"
   - Als Zahl (z.B. 3 oder 3.5)

4) BAUJAHR:
   - Suche: "Baujahr"
   - 4-stellig (z.B. 1995)

5) ADRESSE:
   - Vollständige Adresse mit Straße, PLZ, Stadt

6) KALTMIETE:
   - Suche im Text nach: "Kaltmiete", "Nettokaltmiete", "Grundmiete"
   - Nimm NUR den Wert bei diesem Label
   - Falls "Jahreskaltmiete" → teile durch 12
   - → Speichere in Feld "miete"
   - Falls nicht gefunden → miete = null

7) HAUSGELD (WICHTIG: GESAMTE Seite durchsuchen!):

   🚨 KRITISCH - Hausgeld hat oft ZWEI Erwähnungen auf der Seite:

   A) OBEN im Inserat: Gesamt-Hausgeld (z.B. "Hausgeld: 245 €")
   B) UNTEN in Beschreibung: Aufteilung in umlegbar/nicht-umlegbar

   ⚠️ STOPPT NICHT nach dem ersten Fund! Durchsuche die KOMPLETTE Seite!

   SCHRITT 1 - Gesamt-Hausgeld finden:
   - Suche im Text nach: "Hausgeld", "monatliches Hausgeld", "Wohngeld"
   - Nimm den Gesamtwert (z.B. 245€)
   - → Speichere in Feld "hausgeld"

   SCHRITT 2 - Nach Aufteilung suchen (KOMPLETTE Seite!):
   - Suche nach diesen Texten ÜBERALL auf der Seite:
     * "umlegbar" oder "Umlegbar" oder "umlagefähig" oder "Umlagefähig"
     * "nicht umlegbar" oder "nicht umlagefähig"
     * "davon umlegbar" oder "davon nicht umlegbar"
   - Schaue in die Beschreibung, in Details, überall!
   - BEISPIEL was du finden könntest:
     * "Hausgeld: 245€, davon umlegbar 147€, nicht umlegbar 98€"
     * "Umlegbares Hausgeld: 147€"
     * "Nicht umlegbare Kosten: 98€"

   SCHRITT 3 - Werte zuweisen:
   - Falls Split gefunden:
     * hausgeld_umlegbar = [gefundener Wert]
     * hausgeld_nicht_umlegbar = [gefundener Wert]
     * KEIN Warning nötig

   - Falls NUR Gesamt-Hausgeld gefunden (KEIN Split):
     * hausgeld_umlegbar = 60% vom Hausgeld
     * hausgeld_nicht_umlegbar = 40% vom Hausgeld
     * Warning: "Hausgeld-Verteilung ist Schätzung (60/40)"

   - Falls GAR KEIN Hausgeld gefunden:
     * hausgeld = null
     * hausgeld_umlegbar = null
     * hausgeld_nicht_umlegbar = null

8) MAKLERGEBÜHR / PROVISION (Käuferprovision):
   🔴 Siehe SCHRITT 1 oben - Provision ZUERST suchen!

   Zusammenfassung:
   - Suche: "Provision für Käufer", "Käuferprovision beträgt", "Provision:", etc.
   - Extrahiere NUR Prozentsatz: "3,0%" → maklergebuehr = 3.0
   - Komma zu Punkt: "3,57%" → 3.57
   - Falls "provisionsfrei" → maklergebuehr = 0
   - Falls nichts gefunden → maklergebuehr = null
   - Falls nur Euro-Betrag → berechne Prozent: (Betrag / Kaufpreis) × 100

   🚨 KRITISCH: NIEMALS maklergebuehr = 0 setzen ohne "provisionsfrei" zu finden!

9) OBJEKTTYP:
   - "Wohnung", "ETW", "Eigentumswohnung" → objekttyp = "wohnung"
   - "Mehrfamilienhaus", "MFH", "Renditeobjekt", "Zinshaus" → objekttyp = "mfh"
   - "Haus", "EFH", "Einfamilienhaus" → objekttyp = "haus"
   - Standard: "wohnung"

10) ANZAHL WOHNEINHEITEN (nur bei MFH):
   - Nur bei objekttyp = "mfh"
   - Suche: "Anzahl Wohneinheiten", "X Wohnungen", "X Einheiten"
   - Beispiel: "5 Wohneinheiten" → anzahl_wohneinheiten = 5
   - Falls nicht gefunden → anzahl_wohneinheiten = null

OUTPUT-QUALITÄT:

confidence:
- "hoch": Kaufpreis, Fläche, Zimmer, Adresse alle gefunden
- "mittel": Kaufpreis und Fläche gefunden, Rest teilweise
- "niedrig": Wichtige Daten fehlen

notes:
- Kurze Zusammenfassung was gefunden wurde
- Beispiel: "Kaufpreis 350.000€, 75m², 3 Zimmer, Baujahr 1995, Kaltmiete 950€/Mon, Hausgeld 245€/Mon, Provision 3.0%"

warnings (Array):
- Leeres Array [] wenn alles OK
- Hinweise für User wenn etwas geschätzt oder unklar ist
- Beispiel: ["Hausgeld-Verteilung ist Schätzung (60/40)"]

🚨🚨🚨 FINAL CHECK - BEVOR DU DAS ERGEBNIS ZURÜCKGIBST! 🚨🚨🚨

BEVOR du die Daten zurückgibst, PRÜFE NOCHMAL:

1. Hast du "maklergebuehr" gesetzt?
   - Falls NEIN → Gehe zurück und suche NOCHMAL nach:
     * "Provision"
     * "Käuferprovision"
     * "Maklergebühr"
     * "Courtage"
   - Durchsuche die KOMPLETTE Seite nochmal!
   - Falls du IMMER NOCH nichts findest → maklergebuehr = null

2. Falls maklergebuehr = 0:
   - Hast du wirklich "provisionsfrei" auf der Seite gesehen?
   - Falls NEIN → Gehe zurück und suche NOCHMAL!
   - Falls JA → OK, 0 ist korrekt

3. Falls maklergebuehr = null:
   - Bist du dir ABSOLUT SICHER, dass kein Prozentsatz auf der Seite steht?
   - Suche NOCHMAL nach "%"
   - Suche NOCHMAL nach "Provision"

4. Falls du Hausgeld gefunden hast:
   - Hast du nach "umlegbar" gesucht? Die GESAMTE Seite?
   - Hast du nach "nicht umlegbar" gesucht? In der Beschreibung unten?
   - Falls du den 60/40 Split anwendest:
     * Bist du dir SICHER, dass KEIN Split auf der Seite steht?
     * Hast du die KOMPLETTE Seite durchsucht, nicht nur oben?
     * Falls du NICHT sicher bist → Suche NOCHMAL!

NUR wenn du diese 4 Punkte geprüft hast, darfst du das Ergebnis zurückgeben!

REGEL: Nur echte Daten aus der Anzeige extrahieren. KEINE Erfindungen!`,
  model: 'gpt-5.4',
  tools: [webSearchForScraping],
  outputType: ImmobilienDataSchema,
  modelSettings: {
    store: true,
    temperature: 0.01  // Very low for consistent extraction (gpt-4o supports this)
  },
});

// HTML Parser Agent - for Playwright fallback (no web search tool)
const htmlParserAgent = new Agent({
  name: 'ImmobilienHTMLParser',
  instructions: `Du extrahierst Daten aus dem HTML-Code von Immobilien-Anzeigen.

Du bekommst den vollständigen HTML-Code einer Immobilien-Anzeige und musst daraus die relevanten Daten extrahieren.

Die Anweisungen sind IDENTISCH zum ImmobilienScraper:

🚨🚨🚨 SCHRITT 1 - PROVISION ZUERST SUCHEN! 🚨🚨🚨

BEVOR du IRGENDWELCHE anderen Daten extrahierst, MUSST du nach der Käuferprovision suchen!

SUCH-STRATEGIE für Provision im HTML:
1. Suche nach diesen EXAKTEN Textmustern:
   - "Provision für Käufer"
   - "Käuferprovision beträgt"
   - "Käuferprovision"
   - "Provision beträgt"
   - "Provision:"
   - "Maklergebühr"
   - "Courtage"
2. Wenn du IRGENDEINEN dieser Texte findest, extrahiere den Prozentsatz!

BEISPIELE:
- "Käuferprovision beträgt 3,0 % (inkl. MwSt.)" → maklergebuehr = 3.0
- "Provision für Käufer: 3,57%" → maklergebuehr = 3.57
- "provisionsfrei" → maklergebuehr = 0

Nach der PROVISIONS-SUCHE, extrahiere die anderen Daten:

🔴 KRITISCH - Kaltmiete vs Hausgeld:

1) KALTMIETE (miete) = Mieteinnahmen vom Mieter
   - Genannt: "Kaltmiete", "Nettokaltmiete", "Grundmiete"
   - Typisch: 600-2000€

2) HAUSGELD (hausgeld) = Nebenkosten des Eigentümers
   - Genannt: "Hausgeld", "monatliches Hausgeld"
   - Typisch: 150-400€

WICHTIG: Das sind ZWEI VERSCHIEDENE Werte! Kaltmiete ist IMMER höher als Hausgeld!

Extrahiere ALLE Felder die du findest. Falls ein Feld nicht vorhanden ist → null.

REGEL: Nur echte Daten aus dem HTML extrahieren. KEINE Erfindungen!`,
  model: 'gpt-5.4',
  tools: [], // No tools - just HTML parsing
  outputType: ImmobilienDataSchema,
  modelSettings: {
    store: true,
    temperature: 0.01
  },
});

export type UrlScraperResult = z.infer<typeof ImmobilienDataSchema>;

/**
 * Extrahiert die erste URL aus einem Text
 * Nützlich wenn User den ganzen Share-Text aus der App einfügen (z.B. "Gerade bei #Kleinanzeigen gefunden... https://...")
 *
 * WICHTIG: Extrahiert vollständige URLs inklusive Query-Parameter und Fragmente
 * Beispiele:
 * - "https://example.com/page?param=value#fragment" → "https://example.com/page?param=value#fragment"
 * - "Schau mal: https://example.com/page mehr Text" → "https://example.com/page"
 */
function extractUrlFromText(input: string): string {
  const trimmed = input.trim();

  // Check if input starts with http/https - likely already a clean URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Extract URL (stops at whitespace, but includes query params and fragments)
    // The regex [^\s]+ matches everything except whitespace
    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }
    return trimmed;
  }

  // Extract URL from text (e.g., share text from app)
  // This handles cases like "Gerade bei #Kleinanzeigen gefunden: https://..."
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = trimmed.match(urlRegex);

  if (urls && urls.length > 0) {
    console.log(`[URL Extractor] Found URL in text: ${urls[0]}`);
    return urls[0];
  }

  // No URL found, return original input
  return trimmed;
}

/**
 * Normalisiert eBay Kleinanzeigen URLs von verschiedenen Quellen (App, Mobile, Desktop)
 * - Konvertiert mobile URLs (m.kleinanzeigen.de) zu Desktop (www.kleinanzeigen.de)
 * - Konvertiert alte Domain (ebay-kleinanzeigen.de) zu neuer Domain (kleinanzeigen.de)
 * - Behandelt App Deep Links und Share-URLs
 */
function normalizeEbayKleinanzeigenUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check if it's an eBay Kleinanzeigen URL
    const isKleinanzeigen =
      urlObj.hostname.includes('kleinanzeigen.de') ||
      urlObj.hostname.includes('ebay-kleinanzeigen.de');

    if (!isKleinanzeigen) {
      return url; // Not an eBay Kleinanzeigen URL, return as is
    }

    // Normalize domain variations
    // m.kleinanzeigen.de → www.kleinanzeigen.de
    // ebay-kleinanzeigen.de → kleinanzeigen.de
    // m.ebay-kleinanzeigen.de → www.kleinanzeigen.de
    let normalizedHost = urlObj.hostname
      .replace('m.kleinanzeigen.de', 'www.kleinanzeigen.de')
      .replace('m.ebay-kleinanzeigen.de', 'www.kleinanzeigen.de')
      .replace('ebay-kleinanzeigen.de', 'kleinanzeigen.de');

    // Ensure www prefix if not present
    if (normalizedHost === 'kleinanzeigen.de') {
      normalizedHost = 'www.kleinanzeigen.de';
    }

    urlObj.hostname = normalizedHost;

    const normalizedUrl = urlObj.toString();
    if (normalizedUrl !== url) {
      console.log(`[URL Normalizer] eBay Kleinanzeigen: ${url} → ${normalizedUrl}`);
    }

    return normalizedUrl;
  } catch (err) {
    // If URL parsing fails, return original
    console.warn('[URL Normalizer] Failed to parse URL, returning original:', err);
    return url;
  }
}

export async function runUrlScraper(input: UrlScraperInput): Promise<UrlScraperResult> {
  if (!input.url) {
    throw new Error('URL ist erforderlich');
  }

  // Extract URL from text (handles app share messages like "Gerade bei #Kleinanzeigen gefunden... https://...")
  let trimmedUrl = extractUrlFromText(input.url);

  // Validate URL (lenient - just check basic format)
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new Error('Ungültige URL. Die URL muss mit http:// oder https:// beginnen.');
  }

  // Remove URL fragments (anything after #) - they are client-side only and can cause issues
  // Example: https://example.com/page#section → https://example.com/page
  if (trimmedUrl.includes('#')) {
    const urlWithoutFragment = trimmedUrl.split('#')[0];
    console.log(`[URL Scraper] Removed fragment: ${trimmedUrl} → ${urlWithoutFragment}`);
    trimmedUrl = urlWithoutFragment;
  }

  // Normalize eBay Kleinanzeigen URLs (mobile app, old domain, etc.)
  trimmedUrl = normalizeEbayKleinanzeigenUrl(trimmedUrl);

  // Log the final URL being processed
  console.log('[URL Scraper] Processing URL:', trimmedUrl);
  try {
    const urlObj = new URL(trimmedUrl);
    console.log('[URL Scraper] Domain:', urlObj.hostname);
  } catch {
    // URL parse failed, but continue anyway
  }

  const runner = new Runner({
    traceMetadata: {
      __trace_source__: 'url-scraper',
      workflow_id: 'wf_url_scraper'
    },
  });

  console.log(`[URL Scraper] 🚀 Method 1: Trying webSearchTool (fast)...`);

  let result;
  let usedPlaywrightFallback = false;

  try {
    // METHOD 1: Try with webSearchTool (fast, works for most portals)
    result = await runner.run(scraperAgent, [
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: `Extrahiere Immobilien-Daten von dieser URL: ${trimmedUrl}`
        }]
      },
    ]);

    // Check if we got valid data
    const hasMinimalData = result.finalOutput?.kaufpreis &&
                           result.finalOutput?.flaeche &&
                           result.finalOutput?.adresse;

    if (!result.finalOutput || !hasMinimalData) {
      console.warn('[URL Scraper] ⚠️ webSearchTool returned incomplete data, trying Playwright fallback...');
      throw new Error('Incomplete data from webSearchTool');
    }

    console.log('[URL Scraper] ✅ webSearchTool succeeded');

  } catch (webSearchError) {
    console.error('[URL Scraper] ❌ webSearchTool failed:', webSearchError);

    // METHOD 2: Fallback to Smart Proxy (multiple strategies: direct, delayed, Playwright)
    console.log('[URL Scraper] 🔄 Method 2: Trying Smart Proxy (anti-bot bypass)...');

    try {
      // Use smart proxy that tries multiple strategies
      const proxyResult = await smartProxyFetch(trimmedUrl);

      if (!proxyResult.success || !proxyResult.html) {
        console.error('[URL Scraper] ❌ Smart Proxy failed:', proxyResult.error);
        throw new Error('Seite konnte nicht geladen werden.\n\n💡 Lösung: Gib die Daten manuell ein.');
      }

      console.log(`[URL Scraper] ✅ Smart Proxy succeeded with method: ${proxyResult.method} - extracted ${proxyResult.html.length} chars of HTML`);

      // Parse HTML with AI
      console.log('[URL Scraper] 🤖 Parsing HTML with AI...');
      result = await runner.run(htmlParserAgent, [
        {
          role: 'user',
          content: [{
            type: 'input_text',
            text: `Extrahiere Immobilien-Daten aus diesem HTML-Code:\n\n${proxyResult.html.slice(0, 50000)}`  // Limit to 50k chars
          }]
        },
      ]);

      usedPlaywrightFallback = true; // Flag that we used fallback (could be direct, delayed, or playwright)
      console.log('[URL Scraper] ✅ Smart Proxy fallback succeeded');

    } catch (proxyError) {
      console.error('[URL Scraper] ❌ Smart Proxy also failed:', proxyError);

      // Both methods failed - provide clear guidance
      throw new Error('Zugriff blockiert.\n\n💡 Lösung: Gib die Daten manuell ein oder probier ein anderes Portal (Immowelt, eBay Kleinanzeigen).');
    }
  }

  // Validation (same for both methods)
  if (!result.finalOutput) {
    throw new Error('Keine Daten gefunden. Stelle sicher, dass der Link zu einem Angebot führt.\n\n💡 Lösung: Gib die Daten manuell ein.');
  }

  console.log('[URL Scraper] Complete (before validation):', {
    kaufpreis: result.finalOutput.kaufpreis,
    flaeche: result.finalOutput.flaeche,
    miete: result.finalOutput.miete,
    hausgeld: result.finalOutput.hausgeld,
    maklergebuehr: result.finalOutput.maklergebuehr,
    confidence: result.finalOutput.confidence,
    usedPlaywright: usedPlaywrightFallback,
  });

  // Check if we have minimal required data to consider this a valid expose
  const hasMinimalData = result.finalOutput.kaufpreis &&
                         result.finalOutput.flaeche &&
                         result.finalOutput.adresse;

  if (!hasMinimalData) {
    const missing = [];
    if (!result.finalOutput.kaufpreis) missing.push('Kaufpreis');
    if (!result.finalOutput.flaeche) missing.push('Wohnfläche');
    if (!result.finalOutput.adresse) missing.push('Adresse');

    throw new Error(`Unvollständige Daten. Fehlend: ${missing.join(', ')}\n\n💡 Lösung: Gib die fehlenden Daten manuell ein.`);
  }

  // POST-PROCESSING VALIDATION: Fix common AI mistakes
  const validatedOutput = validateAndFixOutput(result.finalOutput);

  // Add note if fallback was used
  if (usedPlaywrightFallback && !validatedOutput.notes) {
    validatedOutput.notes = 'Daten per Fallback-Methode extrahiert';
  } else if (usedPlaywrightFallback && validatedOutput.notes) {
    validatedOutput.notes += ' | Per Fallback extrahiert';
  }

  console.log('[URL Scraper] After validation:', {
    miete: validatedOutput.miete,
    hausgeld: validatedOutput.hausgeld,
    hausgeld_umlegbar: validatedOutput.hausgeld_umlegbar,
    hausgeld_nicht_umlegbar: validatedOutput.hausgeld_nicht_umlegbar,
    maklergebuehr: validatedOutput.maklergebuehr,
    swapped: validatedOutput.miete !== result.finalOutput.miete,
    usedPlaywright: usedPlaywrightFallback,
  });

  return validatedOutput;
}

/**
 * Post-processing validation to fix common AI agent mistakes
 * This is our safety net!
 */
function validateAndFixOutput(output: UrlScraperResult): UrlScraperResult {
  console.log('[VALIDATION] Starting validation...');
  console.log('[VALIDATION] Input - miete:', output.miete, 'hausgeld:', output.hausgeld);

  const validated = { ...output };
  const warnings = [...(output.warnings || [])];
  let swapped = false;

  // Typical ranges for validation (€/m² based - much smarter!)
  const TYPICAL_KALTMIETE_MIN_PER_SQM = 8;    // Minimum for Kaltmiete: 8 €/m²
  const TYPICAL_HAUSGELD_MAX_PER_SQM = 10;    // Maximum for Hausgeld: 10 €/m²
  const TYPICAL_HAUSGELD_MIN_PER_SQM = 1.5;   // Minimum for Hausgeld: 1.5 €/m²

  // CRITICAL: Validate Kaltmiete vs Hausgeld
  if (validated.miete !== null && validated.hausgeld !== null && validated.miete > 0 && validated.hausgeld > 0) {
    console.log('[VALIDATION] Both values present - checking relationship...');

    // If Hausgeld > Kaltmiete, they are definitely swapped!
    if (validated.hausgeld > validated.miete) {
      console.error('[VALIDATION] 🚨 ERROR DETECTED: Hausgeld > Kaltmiete - SWAPPING!');
      console.error(`[VALIDATION] Before: miete=${validated.miete}, hausgeld=${validated.hausgeld}`);

      // Swap them
      const temp = validated.miete;
      validated.miete = validated.hausgeld;
      validated.hausgeld = temp;
      swapped = true;

      console.error(`[VALIDATION] After: miete=${validated.miete}, hausgeld=${validated.hausgeld}`);

      // Add warning
      warnings.push('⚠️ AUTOMATISCH KORRIGIERT: Agent hatte Kaltmiete und Hausgeld vertauscht. Werte wurden korrigiert.');
    } else {
      console.log('[VALIDATION] ✓ Kaltmiete > Hausgeld - Correct relationship');
    }

    // Additional check: Kaltmiete should be significantly higher than Hausgeld
    if (validated.miete < validated.hausgeld * 1.5) {
      console.warn('[VALIDATION] ⚠️ Unusual: Kaltmiete is only', (validated.miete / validated.hausgeld).toFixed(2), 'times Hausgeld');
      warnings.push('⚠️ ACHTUNG: Kaltmiete erscheint ungewöhnlich niedrig im Verhältnis zum Hausgeld. Bitte die Werte in der Originalanzeige überprüfen!');
    }
  }
  // NEW: Smart detection when miete is suspiciously low AND hausgeld is missing
  // Uses €/m² ratio for more accurate detection (works for any apartment size!)
  else if (validated.miete !== null && validated.miete > 0 &&
           (validated.hausgeld === null || validated.hausgeld === 0) &&
           validated.flaeche !== null && validated.flaeche > 0) {

    const mietePerSqm = validated.miete / validated.flaeche;
    console.log(`[VALIDATION] Checking if low miete value is actually Hausgeld... (${mietePerSqm.toFixed(2)} €/m²)`);

    // If "miete" per m² is in Hausgeld range but below Kaltmiete range, it's misidentified!
    // Typical: Kaltmiete 8-25 €/m², Hausgeld 1.5-10 €/m²
    if (mietePerSqm < TYPICAL_KALTMIETE_MIN_PER_SQM && mietePerSqm >= TYPICAL_HAUSGELD_MIN_PER_SQM) {
      console.error('[VALIDATION] 🚨 ERROR DETECTED: Miete per m² is too low and in Hausgeld range!');
      console.error(`[VALIDATION] miete/m²=${mietePerSqm.toFixed(2)} is below ${TYPICAL_KALTMIETE_MIN_PER_SQM} €/m² - likely this is Hausgeld!`);

      // Move miete to hausgeld, set miete to null
      validated.hausgeld = validated.miete;
      validated.miete = null;
      swapped = true;

      // Apply 60/40 split if not already present
      if (!validated.hausgeld_umlegbar && !validated.hausgeld_nicht_umlegbar) {
        validated.hausgeld_umlegbar = Math.round(validated.hausgeld * 0.6 * 100) / 100;
        validated.hausgeld_nicht_umlegbar = Math.round(validated.hausgeld * 0.4 * 100) / 100;
        console.log(`[VALIDATION] Applied 60/40 split: umlegbar=${validated.hausgeld_umlegbar}, nicht_umlegbar=${validated.hausgeld_nicht_umlegbar}`);
        warnings.push('ℹ️ Hausgeld-Aufteilung: 60% umlegbar, 40% nicht umlegbar (Standardverteilung)');
      }

      console.error(`[VALIDATION] After correction: miete=null, hausgeld=${validated.hausgeld} (${mietePerSqm.toFixed(2)} €/m²)`);
      warnings.push('⚠️ AUTOMATISCH KORRIGIERT: Agent hat Hausgeld als Kaltmiete erkannt. Wert wurde ins Hausgeld-Feld verschoben. Kaltmiete konnte nicht gefunden werden.');
    } else if (mietePerSqm >= TYPICAL_KALTMIETE_MIN_PER_SQM) {
      console.log(`[VALIDATION] ✓ Miete per m² (${mietePerSqm.toFixed(2)} €/m²) is in normal range - OK`);
    } else {
      console.warn(`[VALIDATION] ⚠️ Miete per m² is very low: ${mietePerSqm.toFixed(2)} €/m²`);
      warnings.push(`⚠️ Kaltmiete erscheint sehr niedrig (${mietePerSqm.toFixed(2)} €/m²). Bitte manuell in der Originalanzeige überprüfen!`);
    }
  }
  // Fallback for when flaeche is missing - use absolute values
  else if (validated.miete !== null && validated.miete > 0 &&
           (validated.hausgeld === null || validated.hausgeld === 0) &&
           (!validated.flaeche || validated.flaeche === 0)) {
    console.log('[VALIDATION] Cannot calculate per m² (flaeche missing), using absolute threshold...');

    // Fallback to absolute values when area is unknown
    if (validated.miete < 400) {
      console.warn('[VALIDATION] ⚠️ Miete value is suspiciously low:', validated.miete);
      warnings.push('⚠️ Kaltmiete erscheint sehr niedrig (unter 400€). Falls dies Hausgeld ist, bitte manuell korrigieren!');
    }
  }
  else if (validated.miete === null && validated.hausgeld !== null) {
    // Only Hausgeld found, no Kaltmiete - could be OK for owner-occupied
    console.warn('[VALIDATION] ⚠️ Only Hausgeld found, no Kaltmiete');
    warnings.push('⚠️ Nur Hausgeld gefunden, keine Kaltmiete. Falls die Wohnung vermietet ist, bitte Kaltmiete manuell nachtragen.');
  }

  // Check if Kaltmiete is suspiciously low (but still high enough to not be Hausgeld)
  if (validated.miete !== null && validated.miete > 0 && validated.miete < 400) {
    console.warn('[VALIDATION] ⚠️ Kaltmiete is very low:', validated.miete);
    warnings.push('⚠️ Kaltmiete erscheint sehr niedrig (unter 400€). Bitte manuell überprüfen!');
  }

  // Check if Kaltmiete is suspiciously high (might be yearly)
  if (validated.miete !== null && validated.miete > 5000) {
    console.warn('[VALIDATION] ⚠️ Kaltmiete is very high:', validated.miete);
    warnings.push('⚠️ Kaltmiete erscheint sehr hoch (über 5000€). Falls Jahresmiete angegeben war, bitte durch 12 teilen!');
  }

  // Check if Hausgeld is suspiciously high (using €/m² if available)
  if (validated.hausgeld !== null && validated.hausgeld > 0) {
    if (validated.flaeche !== null && validated.flaeche > 0) {
      const hausgeldPerSqm = validated.hausgeld / validated.flaeche;
      if (hausgeldPerSqm > TYPICAL_HAUSGELD_MAX_PER_SQM) {
        console.warn(`[VALIDATION] ⚠️ Hausgeld per m² is unusually high: ${hausgeldPerSqm.toFixed(2)} €/m²`);
        warnings.push(`⚠️ Hausgeld erscheint ungewöhnlich hoch (${hausgeldPerSqm.toFixed(2)} €/m²). Bitte manuell überprüfen!`);
      }
    } else if (validated.hausgeld > 800) {
      // Fallback: absolute value check when flaeche missing
      console.warn('[VALIDATION] ⚠️ Hausgeld is unusually high:', validated.hausgeld);
      warnings.push(`⚠️ Hausgeld erscheint ungewöhnlich hoch (über 800€). Bitte manuell überprüfen!`);
    }
  }

  // ALWAYS apply 60/40 split if Hausgeld present but split missing or incorrect
  if (validated.hausgeld !== null && validated.hausgeld > 0) {
    const umlegbar = validated.hausgeld_umlegbar || 0;
    const nichtUmlegbar = validated.hausgeld_nicht_umlegbar || 0;
    const splitSum = umlegbar + nichtUmlegbar;

    // Apply 60/40 split if:
    // 1. Both split values are missing/0, OR
    // 2. Only one split value is set (incomplete), OR
    // 3. Split sum doesn't match total (with 1€ tolerance for rounding)
    const needsSplit =
      (umlegbar === 0 && nichtUmlegbar === 0) ||
      (umlegbar === 0 && nichtUmlegbar > 0) ||
      (umlegbar > 0 && nichtUmlegbar === 0) ||
      (Math.abs(splitSum - validated.hausgeld) > 1);

    if (needsSplit) {
      validated.hausgeld_umlegbar = Math.round(validated.hausgeld * 0.6 * 100) / 100;
      validated.hausgeld_nicht_umlegbar = Math.round(validated.hausgeld * 0.4 * 100) / 100;
      console.log(`[VALIDATION] Applied default 60/40 split: umlegbar=${validated.hausgeld_umlegbar}, nicht_umlegbar=${validated.hausgeld_nicht_umlegbar}`);

      // Only add warning if not already added earlier
      if (!warnings.some(w => w.includes('Hausgeld-Aufteilung'))) {
        warnings.push('ℹ️ Hausgeld-Aufteilung: 60% umlagefähig (60%), 40% nicht umlagefähig (40%) - Standardverteilung');
      }
    }
  }

  // Check Maklergebühr: Both null and 0 are suspicious
  if (validated.kaufpreis !== null && validated.kaufpreis > 0) {
    if (validated.maklergebuehr === null) {
      console.error('[VALIDATION] 🚨 Maklergebühr is NULL but Kaufpreis exists - agent FAILED to find it!');
      warnings.push('🚨 KRITISCH: Maklergebühr wurde nicht gefunden! Bitte manuell als Prozentsatz (z.B. 3.0 für 3%) nachtragen.');
    } else if (validated.maklergebuehr === 0) {
      console.error('[VALIDATION] 🚨 Maklergebühr is 0 - agent should only set this if "provisionsfrei"!');
      warnings.push('⚠️ Maklergebühr wurde als 0 erkannt. Falls KEINE explizite "provisionsfrei" Angabe existiert, bitte manuell nachtragen!');
    } else if (validated.maklergebuehr > 10) {
      // Check if percentage looks suspicious (too high)
      console.warn('[VALIDATION] ⚠️ Maklergebühr percentage seems very high:', validated.maklergebuehr);
      warnings.push(`⚠️ Maklergebühr erscheint sehr hoch (${validated.maklergebuehr}%). Bitte überprüfen - normalerweise 2-4%.`);
    }
  }

  // Update warnings array
  validated.warnings = warnings;

  console.log('[VALIDATION] Complete - swapped:', swapped, '- warnings:', warnings.length);
  return validated;
}
