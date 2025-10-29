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

// Scraper Agent - back to gpt-4o-mini with clearer instructions
const scraperAgent = new Agent({
  name: 'ImmobilienScraper',
  instructions: `Du extrahierst Daten aus Immobilien-Anzeigen (ImmobilienScout24, Immowelt, etc.).

🔴 KRITISCH - Kaltmiete vs Hausgeld verstehen:

In deutschen Immobilien-Anzeigen gibt es zwei VERSCHIEDENE monatliche Beträge:

1) KALTMIETE = Miete die der Mieter zahlt (Einnahmen für Eigentümer)
   - Wird genannt: "Kaltmiete", "Nettokaltmiete", "Grundmiete"
   - Typisch: 600-2000€ pro Monat
   - Beispiel im Inserat: "Kaltmiete: 950,00 €"
   - → Extrahiere diesen Wert ins Feld "miete"

2) HAUSGELD = Nebenkosten die der Eigentümer zahlt (Ausgaben)
   - Wird genannt: "Hausgeld", "monatliches Hausgeld", "Nebenkosten", "Wohngeld"
   - Typisch: 150-400€ pro Monat
   - Beispiel im Inserat: "Hausgeld: 245,00 €"
   - → Extrahiere diesen Wert ins Feld "hausgeld"

WICHTIG: Das sind ZWEI VERSCHIEDENE Werte!
- Wenn du "Kaltmiete: 950€" siehst → miete = 950, NICHT hausgeld!
- Wenn du "Hausgeld: 245€" siehst → hausgeld = 245, NICHT miete!
- Kaltmiete ist IMMER höher als Hausgeld!

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

7) HAUSGELD:
   - Suche im Text nach: "Hausgeld", "monatliches Hausgeld", "Wohngeld"
   - Nimm NUR den Wert bei diesem Label
   - → Speichere in Feld "hausgeld"
   - Falls nicht gefunden → hausgeld = null
   - Falls Hausgeld gefunden OHNE Aufteilung:
     * hausgeld_umlegbar = 60% vom Hausgeld
     * hausgeld_nicht_umlegbar = 40% vom Hausgeld
     * Warning: "Hausgeld-Verteilung ist Schätzung"

8) MAKLERGEBÜHR / PROVISION:
   - Suche: "Provision", "Maklergebühr", "Käuferprovision"
   - Falls "provisionsfrei" → maklergebuehr = 0
   - Falls Prozent (z.B. "3,57%"):
     * UND Kaufpreis bekannt → berechne Euro-Betrag
     * ABER Kaufpreis unbekannt → maklergebuehr = null
   - Falls Euro-Betrag angegeben → übernehmen
   - Falls nichts gefunden → maklergebuehr = null

9) OBJEKTTYP:
   - "Wohnung", "ETW", "Eigentumswohnung" → objekttyp = "wohnung"
   - "Haus", "EFH", "MFH" → objekttyp = "haus"
   - Standard: "wohnung"

OUTPUT-QUALITÄT:

confidence:
- "hoch": Kaufpreis, Fläche, Zimmer, Adresse alle gefunden
- "mittel": Kaufpreis und Fläche gefunden, Rest teilweise
- "niedrig": Wichtige Daten fehlen

notes:
- Kurze Zusammenfassung was gefunden wurde
- Beispiel: "Kaufpreis 350.000€, 75m², 3 Zimmer, Baujahr 1995, Kaltmiete 950€/Mon, Hausgeld 245€/Mon"

warnings (Array):
- Leeres Array [] wenn alles OK
- Hinweise für User wenn etwas geschätzt oder unklar ist
- Beispiel: ["Hausgeld-Verteilung ist Schätzung (60/40)"]

REGEL: Nur echte Daten aus der Anzeige extrahieren. KEINE Erfindungen!`,
  model: 'gpt-4o-mini',  // Optimized for cost/performance with clear instructions
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
