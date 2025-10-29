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

// Scraper Agent mit gpt-4o für bessere Genauigkeit
const scraperAgent = new Agent({
  name: 'ImmobilienScraper',
  instructions: `Du bist ein präziser Daten-Extraktor für Immobilien-Anzeigen.

WICHTIGSTE REGEL - LESE DIES 3x:
"Kaltmiete" und "Hausgeld" sind VERSCHIEDENE Werte!
- Suche nach dem WORT "Kaltmiete" → das ist die Miete
- Suche nach dem WORT "Hausgeld" → das ist das Hausgeld
- NIEMALS verwechseln oder einen Wert für beide benutzen!

EXTRAKTIONS-ANLEITUNG:

Schritt 1: Suche nach "Kaufpreis" → nur die Zahl
Schritt 2: Suche nach "Wohnfläche" oder "m²" → nur die Zahl
Schritt 3: Suche nach "Zimmer" → als Zahl (z.B. 3 oder 3.5)
Schritt 4: Suche nach "Baujahr" → 4-stellige Jahreszahl
Schritt 5: Suche nach Adresse → vollständiger Text

Schritt 6 - KALTMIETE (sehr wichtig!):
- Suche nach dem genauen Wort "Kaltmiete"
- Oder: "Nettokaltmiete" oder "Grundmiete"
- Nimm nur diesen Wert
- Falls "Jahreskaltmiete" → teile durch 12
- Setze in Feld: miete

Schritt 7 - HAUSGELD (sehr wichtig!):
- Suche nach dem genauen Wort "Hausgeld"
- Oder: "monatliches Hausgeld" oder "Nebenkosten"
- Nimm nur diesen Wert
- Setze in Feld: hausgeld

Schritt 8 - MAKLERGEBÜHR:
- Suche nach "Provision" oder "Maklergebühr" oder "Käuferprovision"
- Falls "provisionsfrei" → maklergebuehr = 0
- Falls Prozent (z.B. "3,57%") UND Kaufpreis bekannt → berechne Betrag
- Falls Prozent ABER Kaufpreis unbekannt → NULL
- Sonst → nimm Euro-Betrag

Schritt 9 - OBJEKTTYP:
- "Wohnung" oder "ETW" → "wohnung"
- "Haus" oder "EFH" oder "MFH" → "haus"
- Standard: "wohnung"

HAUSGELD-VERTEILUNG:
- Falls nur Gesamt-Hausgeld gefunden:
  * hausgeld_umlegbar = 60% vom Hausgeld
  * hausgeld_nicht_umlegbar = 40% vom Hausgeld
  * Warning: "Hausgeld-Verteilung ist Schätzung (60/40). Bitte WEG-Unterlagen prüfen."

CONFIDENCE & NOTES:
- confidence "hoch": Alle Hauptdaten vorhanden
- confidence "mittel": Einige Daten fehlen
- confidence "niedrig": Viele Daten fehlen
- notes: Kurze Zusammenfassung was gefunden wurde
- warnings: Array mit Hinweisen für User (oder leeres Array [])

WICHTIG: Nur Daten aus Quelle extrahieren. KEINE Schätzungen außer Hausgeld-Verteilung.`,
  model: 'gpt-4o',  // Upgraded to gpt-4o for better accuracy
  tools: [webSearchForScraping],
  outputType: ImmobilienDataSchema,
  modelSettings: {
    store: true,
    temperature: 0.01  // Extrem niedrig für konsistente Extraktion
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

  console.log('[URL Scraper] Complete (before validation):', {
    kaufpreis: result.finalOutput.kaufpreis,
    flaeche: result.finalOutput.flaeche,
    miete: result.finalOutput.miete,
    hausgeld: result.finalOutput.hausgeld,
    confidence: result.finalOutput.confidence,
  });

  // POST-PROCESSING VALIDATION: Fix common AI mistakes
  const validatedOutput = validateAndFixOutput(result.finalOutput);

  console.log('[URL Scraper] After validation:', {
    miete: validatedOutput.miete,
    hausgeld: validatedOutput.hausgeld,
    swapped: validatedOutput.miete !== result.finalOutput.miete,
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

  // CRITICAL: Validate Kaltmiete vs Hausgeld
  if (validated.miete !== null && validated.hausgeld !== null) {
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
  } else if (validated.miete === null && validated.hausgeld !== null) {
    // Only Hausgeld found, no Kaltmiete - suspicious!
    console.warn('[VALIDATION] ⚠️ Only Hausgeld found, no Kaltmiete - might be wrong');
    warnings.push('⚠️ Nur Hausgeld gefunden, keine Kaltmiete. Bitte manuell prüfen!');
  } else if (validated.miete !== null && validated.hausgeld === null) {
    console.log('[VALIDATION] Only Kaltmiete found - OK (property might be owner-occupied)');
  }

  // Check if Kaltmiete is suspiciously low
  if (validated.miete !== null && validated.miete > 0 && validated.miete < 200) {
    console.warn('[VALIDATION] ⚠️ Kaltmiete is very low:', validated.miete);
    warnings.push('⚠️ Kaltmiete erscheint sehr niedrig (unter 200€). Bitte manuell überprüfen!');
  }

  // Check if Kaltmiete is suspiciously high (might be yearly)
  if (validated.miete !== null && validated.miete > 5000) {
    console.warn('[VALIDATION] ⚠️ Kaltmiete is very high:', validated.miete);
    warnings.push('⚠️ Kaltmiete erscheint sehr hoch (über 5000€). Falls Jahresmiete angegeben war, bitte durch 12 teilen!');
  }

  // Update warnings array
  validated.warnings = warnings;

  console.log('[VALIDATION] Complete - swapped:', swapped, '- warnings:', warnings.length);
  return validated;
}
