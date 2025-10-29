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
  maklergebuehr: z.number().nullable(), // Maklergebühr als Prozentsatz (z.B. 3.57) oder Euro-Betrag (z.B. 15000)
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
  maklergebuehr: 3.57  ← NUR der Prozentsatz (NICHT berechnen!)
}

FALSCH wäre:
- miete: 245 (das ist Hausgeld!)
- hausgeld: 950 (das ist Kaltmiete!)
- miete: null und hausgeld: 950 (beide Werte verwechselt!)
- maklergebuehr: null (wenn Prozent angegeben!)
- maklergebuehr: 12495 (NICHT in Euro umrechnen!)

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

8) MAKLERGEBÜHR / PROVISION (Käuferprovision):
   WICHTIG: Extrahiere NUR den Prozentsatz, KEINE Berechnung!

   - Suche SEHR SORGFÄLTIG nach diesen Begriffen im kompletten Text:
     * "Provision", "Maklergebühr", "Käuferprovision", "Innen­courtage"
     * "Käufer­provision beträgt", "Provision beträgt"
     * Prozentzahlen wie "3,57%", "3,0 %", "3.0%", etc.

   - EXTRAKTION:

     A) Falls "provisionsfrei" oder "Keine Käuferprovision":
        → maklergebuehr = 0

     B) Falls Prozent-Angabe gefunden (z.B. "3,0%", "3,57%", "Provision beträgt 3,0 % inkl. MwSt."):
        → Extrahiere NUR die Zahl (z.B. "3,0" oder "3.57")
        → maklergebuehr = 3.0  oder  maklergebuehr = 3.57
        → ⚠️ NICHT in Euro umrechnen! Nur den Prozentsatz!

     C) Falls Euro-Betrag direkt angegeben (z.B. "Maklergebühr: 15.000 €"):
        → maklergebuehr = 15000
        → (Großer Wert > 100 wird als Euro interpretiert)

     D) Falls GAR NICHTS über Provision im Text:
        → maklergebuehr = null

   - Beispiele:
     * "Käuferprovision beträgt 3,0 % (inkl. MwSt.)" → maklergebuehr = 3.0
     * "Provision: 3,57%" → maklergebuehr = 3.57
     * "Provision: 2.38% inkl. gesetzl. MwSt." → maklergebuehr = 2.38
     * "Provisionsfrei" → maklergebuehr = 0
     * "Maklergebühr: 12.000 €" → maklergebuehr = 12000

   - ❌ NIEMALS maklergebuehr = 0 setzen, außer bei explizit "provisionsfrei"!
   - ❌ NIEMALS den Prozentsatz in Euro umrechnen!
   - ✅ Einfach den Prozentsatz als Zahl extrahieren (z.B. 3.0)

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
    maklergebuehr: result.finalOutput.maklergebuehr,
    confidence: result.finalOutput.confidence,
  });

  // POST-PROCESSING VALIDATION: Fix common AI mistakes
  const validatedOutput = validateAndFixOutput(result.finalOutput);

  console.log('[URL Scraper] After validation:', {
    miete: validatedOutput.miete,
    hausgeld: validatedOutput.hausgeld,
    hausgeld_umlegbar: validatedOutput.hausgeld_umlegbar,
    hausgeld_nicht_umlegbar: validatedOutput.hausgeld_nicht_umlegbar,
    maklergebuehr: validatedOutput.maklergebuehr,
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

  // ALWAYS apply 60/40 split if Hausgeld present but split missing
  if (validated.hausgeld !== null && validated.hausgeld > 0 &&
      (!validated.hausgeld_umlegbar || validated.hausgeld_umlegbar === 0) &&
      (!validated.hausgeld_nicht_umlegbar || validated.hausgeld_nicht_umlegbar === 0)) {
    validated.hausgeld_umlegbar = Math.round(validated.hausgeld * 0.6 * 100) / 100;
    validated.hausgeld_nicht_umlegbar = Math.round(validated.hausgeld * 0.4 * 100) / 100;
    console.log(`[VALIDATION] Applied default 60/40 split: umlegbar=${validated.hausgeld_umlegbar}, nicht_umlegbar=${validated.hausgeld_nicht_umlegbar}`);

    // Only add warning if not already added earlier
    if (!warnings.some(w => w.includes('Hausgeld-Aufteilung'))) {
      warnings.push('ℹ️ Hausgeld-Aufteilung: 60% umlegbar, 40% nicht umlegbar (Standardverteilung)');
    }
  }

  // Check Maklergebühr: If 0 or null but there's a Kaufpreis, warn user
  if ((validated.maklergebuehr === 0 || validated.maklergebuehr === null) &&
      validated.kaufpreis !== null && validated.kaufpreis > 0) {
    console.warn('[VALIDATION] ⚠️ Maklergebühr is 0/null but Kaufpreis exists - agent may have missed it');
    warnings.push('⚠️ Käuferprovision wurde nicht erkannt. Falls im Inserat ein Prozentsatz angegeben ist (z.B. "3,57%"), bitte manuell in Step A eintragen.');
  }

  // Update warnings array
  validated.warnings = warnings;

  console.log('[VALIDATION] Complete - swapped:', swapped, '- warnings:', warnings.length);
  return validated;
}
