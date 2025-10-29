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

🚨🚨🚨 EXTREM WICHTIG - LIES DIES ZUERST 🚨🚨🚨
VERWECHSLE NIEMALS KALTMIETE MIT HAUSGELD!!!
KALTMIETE = EINNAHMEN (was Mieter zahlt)
HAUSGELD = AUSGABEN (was Eigentümer zahlt)
🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

WAS EXTRAHIEREN:
1) Kaufpreis in Euro nur Zahl
2) Wohnfläche in m² nur Zahl
3) Anzahl Zimmer als Dezimal z.B. 3.5
4) Baujahr 4-stellig
5) Adresse vollständig Straße PLZ Stadt
6) Kaltmiete NUR MONATLICH - SUPER KRITISCH siehe unten
7) Hausgeld/Nebenkosten - SUPER KRITISCH siehe unten
8) Maklergebühr / Käuferprovision - KRITISCH siehe unten
9) Objekttyp - WICHTIG siehe unten

KRITISCH OBJEKTTYP:
- NUR diese Werte erlaubt: "wohnung" oder "haus"
- WENN Text sagt Wohnung, Eigentumswohnung, ETW → setze "wohnung"
- WENN Text sagt Haus, Einfamilienhaus, Mehrfamilienhaus, EFH, MFH → setze "haus"
- Standard bei Unsicherheit: "wohnung"

═══════════════════════════════════════════════════════════════════
🚨 SUPER KRITISCH: KALTMIETE vs HAUSGELD - ABSOLUT GETRENNT! 🚨
═══════════════════════════════════════════════════════════════════

🔴🔴🔴 PFLICHTLEKTÜRE - LESE DIES 5x !!! 🔴🔴🔴

DEFINITION KALTMIETE (Feld: miete):
  ✅ Das ist EINKOMMEN - Was der MIETER als Miete zahlt
  ✅ Ist normalerweise zwischen 500€ - 2000€ pro Monat
  ✅ IMMER HÖHER als Hausgeld (meist 3-5x höher!)
  ✅ Suche EXAKT nach diesen Begriffen:
     - "Kaltmiete" ODER "Nettokaltmiete" ODER "Grundmiete"
  ❌ ABSOLUT NIEMALS: "Hausgeld", "Nebenkosten", "Wohngeld", "Betriebskosten"
  ❌ WENN im Text steht "Hausgeld: 250€" → Das ist NICHT Kaltmiete!
  ❌ WENN du nur Hausgeld findest → miete = NULL (nicht Hausgeld einsetzen!)

DEFINITION HAUSGELD (Feld: hausgeld):
  ✅ Das sind AUSGABEN - Kosten die der EIGENTÜMER zahlt
  ✅ Ist normalerweise zwischen 100€ - 400€ pro Monat
  ✅ IMMER NIEDRIGER als Kaltmiete
  ✅ Suche EXAKT nach diesen Begriffen:
     - "Hausgeld" ODER "monatliches Hausgeld" ODER "Nebenkosten" ODER "Wohngeld"
  ❌ ABSOLUT NIEMALS: "Kaltmiete", "Nettokaltmiete", "Grundmiete", "Mieteinnahmen"
  ❌ WENN im Text steht "Kaltmiete: 950€" → Das ist NICHT Hausgeld!
  ❌ WENN du nur Kaltmiete findest → hausgeld = NULL (nicht Kaltmiete einsetzen!)

🔥 MANDATORY VALIDATION - IMMER PRÜFEN:
1. Hast du BEIDE Werte gefunden (Kaltmiete UND Hausgeld)?
   → JA: Ist Kaltmiete mindestens 2x höher als Hausgeld?
     → NEIN? DANN FEHLER! Du hast sie vertauscht!
   → NEIN: Setze fehlenden Wert auf NULL (nie raten/kopieren!)

2. Ist Kaltmiete < 200€ ODER > 5000€?
   → Warning hinzufügen: "⚠️ Kaltmiete ungewöhnlich - bitte prüfen"

3. Ist Hausgeld > Kaltmiete?
   → STOP! Werte sind vertauscht! Korrigiere sofort!
   → Warning: "⚠️ Werte wurden vertauscht und korrigiert"

BEISPIEL KORREKTES PARSING:
Text: "Kaltmiete: 950€, Hausgeld: 250€"
→ miete = 950
→ hausgeld = 250
→ Validation: 950 > 250 ✓ OK!

BEISPIEL FALSCHES PARSING (NIEMALS SO!):
Text: "Kaltmiete: 950€, Hausgeld: 250€"
→ miete = 250  ❌❌❌ FALSCH!!!
→ hausgeld = 950  ❌❌❌ FALSCH!!!

SCHRITT-FÜR-SCHRITT OBLIGATORISCH:
1️⃣ Suche ZUERST nach dem exakten Wort "Kaltmiete"
   → Gefunden? Notiere den Wert als CANDIDATE_MIETE
   → Nicht gefunden? CANDIDATE_MIETE = NULL
2️⃣ Suche DANN nach dem exakten Wort "Hausgeld"
   → Gefunden? Notiere den Wert als CANDIDATE_HAUSGELD
   → Nicht gefunden? CANDIDATE_HAUSGELD = NULL
3️⃣ VALIDIERE:
   → Wenn beide gefunden: CANDIDATE_MIETE muss > CANDIDATE_HAUSGELD sein
   → Wenn nicht: TAUSCHE sie (du hast Fehler gemacht!)
4️⃣ Setze finale Werte:
   → miete = CANDIDATE_MIETE (oder NULL)
   → hausgeld = CANDIDATE_HAUSGELD (oder NULL)

JAHRESMIETE UMRECHNUNG:
- Text sagt "Jahreskaltmiete" / "jährliche Miete" → teile durch 12
- Text sagt nur "Kaltmiete" → direkt übernehmen (ist monatlich)
- IMMER monatlichen Wert in miete speichern, NIE Jahreswert

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

═══════════════════════════════════════════════════════════════════
🚨 KRITISCH: MAKLERGEBÜHR / KÄUFERPROVISION 🚨
═══════════════════════════════════════════════════════════════════

WICHTIG: Suche nach "Käuferprovision", "Maklergebühr", "Provision", "Courtage"

VARIANTEN:
1️⃣ PROVISIONSFREI:
   - Text: "provisionsfrei", "keine Provision", "0% Provision"
   → maklergebuehr = 0
   → notes: "Provisionsfrei"

2️⃣ PROZENTSATZ (z.B. 3,57%, 2,38%, 7,14%):
   - Text: "Käuferprovision: 3,57%" oder "Provision 2,38% inkl. MwSt"
   - WENN Kaufpreis vorhanden:
     → Berechne: maklergebuehr = Kaufpreis * (Prozent / 100)
     → notes: "Maklergebühr X% = Y Euro (berechnet)"
   - WENN Kaufpreis fehlt:
     → maklergebuehr = NULL
     → warnings: "Maklergebühr X% bekannt - wird nach Kaufpreis-Eingabe berechnet"
     → notes: "Maklergebühr X% (nicht berechnet)"

3️⃣ FESTER EURO-BETRAG:
   - Text: "Käuferprovision: 8.500 Euro"
   → maklergebuehr = 8500
   → notes: "Maklergebühr: 8.500 Euro"

4️⃣ NICHT ANGEGEBEN:
   → maklergebuehr = NULL
   → notes: "Maklergebühr nicht in Anzeige angegeben"

⚠️ HÄUFIGER FEHLER: Standard 3,57% NICHT automatisch annehmen!
   → NUR wenn EXPLIZIT im Text steht!
   → Wenn nicht angegeben → NULL setzen

CONFIDENCE:
- hoch: Kaufpreis Fläche Zimmer Adresse alle da
- mittel: Kaufpreis Fläche da aber Rest fehlt teilweise
- niedrig: wichtige Daten fehlen

NOTES STRUKTUR (immer dokumentieren was gefunden wurde):
Kaufpreis: X Euro, Fläche: Y m², Zimmer: Z, Baujahr: YYYY, Adresse: [gefunden/nicht gefunden].
Kaltmiete: X Euro/Monat (gefunden als: "Kaltmiete" im Text).
Hausgeld: X Euro/Monat (gefunden als: "Hausgeld" im Text, Verteilung geschätzt).
Validierung: Kaltmiete > Hausgeld ✓ [oder Warnung wenn nicht].
Makler: [provisionsfrei/X%/X Euro].

WARNINGS FÜR USER (Array - IMMER zurückgeben, auch wenn leer):
Nur hinzufügen wenn relevant z.B.:
- Hausgeld-Verteilung ist Schätzung (60% umlegbar, 40% nicht umlegbar). Bitte nach Erhalt der WEG-Unterlagen genaue Werte eintragen.
- Miete evtl. Jahreswert bitte prüfen
- ⚠️ WARNUNG: Kaltmiete scheint ungewöhnlich niedrig oder gleich Hausgeld - bitte manuell prüfen!
- ⚠️ WARNUNG: Hausgeld fehlt komplett im Inserat - bitte nach WEG-Unterlagen fragen
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
