/**
 * Vollständige Analyse (POST /api/agent/run): Validierung, Plan-Prüfung, Kostenschutz und Agent-Lauf.
 *
 * Die Route selbst (src/app/api/agent/run/route.ts) baut nur die echten Abhängigkeiten zusammen,
 * damit dieser Ablauf ohne Clerk, Supabase und OpenAI testbar ist.
 *
 * Reihenfolge (billig vor teuer):
 *   1. angemeldet?                       sonst 401
 *   2. Eingaben gültig?                  sonst 400
 *   3. Plan: Premium / Gratis frei / gleiche Gratis-Wohnung?   sonst 402 (Client öffnet die Paywall)
 *   4. Rate Limit pro Nutzer             sonst 429
 *   5. globales KI-Tagesbudget           sonst 503
 *   6. Geocoding + Agent
 *   7. Gratis-Analyse verbuchen (nur nach Erfolg, atomar)       Kontingent inzwischen weg: 402
 */
import { z } from 'zod';
import type { WorkflowInput } from '@/lib/agentWorkflow';
import { MELDUNG_ANMELDUNG, MELDUNG_GRATIS_AUFGEBRAUCHT, MELDUNG_SCHUTZ_NICHT_VERFUEGBAR } from '@/config/limits';
import { pruefeLimitsUndBudget, schutzAntwort, type SchutzDeps } from '@/lib/kostenSchutz';
import {
  normalisiereAdresse, pruefePlan, verbucheGratisAnalyse, type PlanEntscheidung, type PlanStore,
} from '@/lib/gratisAnalyse';

export interface GeoBasics {
  city?: string;
  district?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
}

export interface AgentRunDeps extends SchutzDeps {
  planStore: PlanStore | null;
  runWorkflow: (input: WorkflowInput) => Promise<unknown>;
  geocodeBasics: (adresse: string) => Promise<GeoBasics>;
  wikidataAreaByPoint: (lat: number, lng: number) => Promise<{ districtLabel?: string; hoodLabel?: string; cityLabel?: string } | null>;
}

const ROUTE = '/api/agent/run';

// ============================================
// INPUT VALIDATION SCHEMA
// ============================================

const InputPayloadSchema = z.object({
  // Basis-Objektdaten (REQUIRED)
  address: z.string().min(5, 'Bitte gib eine gültige Adresse ein (mindestens 5 Zeichen)'),
  objektTyp: z.enum(['wohnung', 'haus', 'gewerbe']).default('wohnung'),
  kaufpreis: z.number().positive('Der Kaufpreis muss größer als 0 sein'),
  flaeche: z.number().min(10, 'Die Wohnfläche muss mindestens 10 m² betragen'),
  zimmer: z.number().min(1, 'Bitte gib mindestens 1 Zimmer ein').max(20, 'Maximal 20 Zimmer möglich'),
  baujahr: z.number().min(1800, 'Das Baujahr muss ab 1800 sein').max(new Date().getFullYear() + 2, 'Das Baujahr liegt zu weit in der Zukunft').nullable().optional(),

  // Finanz-Daten (REQUIRED)
  miete: z.number().min(0, 'Die Miete kann nicht negativ sein'),
  hausgeld: z.number().min(0, 'Das Hausgeld kann nicht negativ sein').default(0),
  hausgeld_umlegbar: z.number().min(0).default(0),
  ek: z.number().min(0, 'Das Eigenkapital kann nicht negativ sein'),
  zins: z.number().min(0, 'Der Zinssatz kann nicht negativ sein').max(20, 'Der Zinssatz ist unrealistisch hoch (max. 20%)'),
  tilgung: z.number().min(0, 'Die Tilgung kann nicht negativ sein').max(10, 'Die Tilgung ist unrealistisch hoch (max. 10%)'),

  // Berechnete KPIs (OPTIONAL)
  cashflowVorSteuer: z.number().optional(),
  cashflowNachSteuern: z.number().nullable().optional(),
  nettoMietrendite: z.number().optional(),
  bruttoMietrendite: z.number().optional(),
  ekRendite: z.number().optional(),
  dscr: z.number().nullable().optional(),
  anschaffungskosten: z.number().optional(),
});

type InputPayload = z.infer<typeof InputPayloadSchema>;

/**
 * Normalisiert objektTyp auf erlaubte Enum-Werte
 */
function normalizeObjektTyp(rawTyp: string | undefined): 'wohnung' | 'haus' | 'gewerbe' {
  if (!rawTyp) return 'wohnung';

  const normalized = rawTyp.toLowerCase().trim();

  // Wohnung variants
  if (normalized.includes('wohnung') || normalized.includes('eigentum') || normalized.includes('etw')) {
    return 'wohnung';
  }

  // Haus variants
  if (normalized.includes('haus') || normalized.includes('efh') || normalized.includes('mfh') ||
      normalized.includes('einfamilienhaus') || normalized.includes('mehrfamilienhaus') ||
      normalized.includes('reihenhaus') || normalized.includes('doppelhaus')) {
    return 'haus';
  }

  // Gewerbe variants
  if (normalized.includes('gewerbe') || normalized.includes('büro') || normalized.includes('laden') ||
      normalized.includes('halle') || normalized.includes('praxis')) {
    return 'gewerbe';
  }

  // Default
  return 'wohnung';
}

/**
 * Zusätzliche Business Logic Validierung
 */
function validateBusinessLogic(payload: InputPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Kaufpreis sollte realistisch zur Fläche sein
  const pricePerSqm = payload.kaufpreis / payload.flaeche;
  if (pricePerSqm < 300) {
    errors.push(`Kaufpreis/m² (${pricePerSqm.toFixed(0)} €) erscheint unrealistisch niedrig`);
  }
  if (pricePerSqm > 15000) {
    errors.push(`Kaufpreis/m² (${pricePerSqm.toFixed(0)} €) erscheint unrealistisch hoch`);
  }

  // 2. Miete sollte realistisch sein
  if (payload.miete > 0) {
    const rentPerSqm = payload.miete / payload.flaeche;
    if (rentPerSqm < 2) {
      errors.push(`Miete/m² (${rentPerSqm.toFixed(2)} €) erscheint unrealistisch niedrig`);
    }
    if (rentPerSqm > 50) {
      errors.push(`Miete/m² (${rentPerSqm.toFixed(2)} €) erscheint unrealistisch hoch`);
    }
  }

  // 3. Eigenkapital sollte plausibel sein
  if (payload.ek > payload.kaufpreis * 1.5) {
    errors.push('Eigenkapital höher als 150% des Kaufpreises - prüfen Sie die Eingabe');
  }

  // 4. Zimmer zu Fläche Ratio
  const sqmPerRoom = payload.flaeche / payload.zimmer;
  if (sqmPerRoom < 10) {
    errors.push(`Durchschnittlich ${sqmPerRoom.toFixed(0)} m²/Zimmer erscheint zu klein`);
  }
  if (sqmPerRoom > 100) {
    errors.push(`Durchschnittlich ${sqmPerRoom.toFixed(0)} m²/Zimmer erscheint zu groß`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sichere Number-Konvertierung: gibt NaN zurück wenn der Wert nicht konvertierbar ist
 */
function safeNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') {
    return NaN;
  }
  const num = Number(val);
  return num;
}

/**
 * Number-Konvertierung mit Default-Wert
 */
function numberWithDefault(val: unknown, defaultValue: number): number {
  if (val === null || val === undefined || val === '') {
    return defaultValue;
  }
  const num = Number(val);
  return Number.isNaN(num) ? defaultValue : num;
}

/**
 * Optionale Number-Konvertierung: gibt undefined zurück wenn Wert fehlt oder NaN
 */
function optionalNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') {
    return undefined;
  }
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}

function paywallAntwort(): Response {
  return schutzAntwort(402, MELDUNG_GRATIS_AUFGEBRAUCHT, 'paywall', { error: true, paywall: true });
}

export async function agentRunPost(req: Request, deps: AgentRunDeps): Promise<Response> {
  try {
    // ============================================
    // 1. ANMELDUNG
    // ============================================
    const userId = await deps.getUserId();
    if (!userId) {
      return schutzAntwort(401, MELDUNG_ANMELDUNG, 'auth', { error: true });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: true, message: 'Ungültige Anfrage' }, { status: 400 });
    }

    // ============================================
    // 2. SCHEMA VALIDATION
    // ============================================
    let validatedPayload: InputPayload;
    try {
      const parsedData = {
        address: (body.address ?? body.adresse) as string,
        objektTyp: normalizeObjektTyp(body.objektTyp as string | undefined),
        kaufpreis: safeNumber(body.kaufpreis),
        flaeche: safeNumber(body.flaeche),
        zimmer: safeNumber(body.zimmer),
        baujahr: body.baujahr ? safeNumber(body.baujahr) : null,
        miete: numberWithDefault(body.miete, 0),
        hausgeld: numberWithDefault(body.hausgeld, 0),
        hausgeld_umlegbar: numberWithDefault(body.hausgeld_umlegbar, 0),
        ek: numberWithDefault(body.ek, 0),
        zins: safeNumber(body.zins),
        tilgung: safeNumber(body.tilgung),
        cashflowVorSteuer: optionalNumber(body.cashflowVorSteuer),
        cashflowNachSteuern: optionalNumber(body.cashflowNachSteuern),
        nettoMietrendite: optionalNumber(body.nettoMietrendite),
        bruttoMietrendite: optionalNumber(body.bruttoMietrendite),
        ekRendite: optionalNumber(body.ekRendite),
        dscr: optionalNumber(body.dscr),
        anschaffungskosten: optionalNumber(body.anschaffungskosten),
      };

      // Pre-validation: Check for NaN in required fields
      const requiredFields = ['kaufpreis', 'flaeche', 'zimmer', 'zins', 'tilgung'] as const;
      const missingFields = requiredFields.filter(field => Number.isNaN(parsedData[field]));

      if (missingFields.length > 0) {
        const errorMsg = `Fehlende oder ungültige Pflichtfelder: ${missingFields.join(', ')}`;
        console.error(`[${ROUTE}] Missing required fields:`, missingFields);
        return Response.json({ error: true, message: errorMsg }, { status: 400 });
      }

      if (typeof parsedData.address !== 'string' || parsedData.address.length < 5) {
        return Response.json({ error: true, message: 'Adresse muss mindestens 5 Zeichen haben' }, { status: 400 });
      }

      validatedPayload = InputPayloadSchema.parse(parsedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Format error messages in a user-friendly way (just the message, not the field path)
        const errorMessages = err.errors.map(e => e.message).join('. ');
        console.error(`[${ROUTE}] Validation error:`, errorMessages);
        return Response.json(
          { error: true, message: `Bitte überprüfe deine Eingaben: ${errorMessages}` },
          { status: 400 }
        );
      }
      throw err;
    }

    const businessValidation = validateBusinessLogic(validatedPayload);
    if (!businessValidation.valid) {
      console.warn(`[${ROUTE}] Business logic warnings:`, businessValidation.errors);
      // Nur warnen, nicht blocken
    }

    const adresseNorm = normalisiereAdresse(validatedPayload.address);
    const analysisId = typeof body.analysisId === 'string' && body.analysisId.trim()
      ? body.analysisId.trim().slice(0, 120)
      : null;

    // ============================================
    // 3. PLAN (serverseitig, einzige Quelle der Wahrheit)
    // ============================================
    if (!deps.planStore) {
      console.error(`[${ROUTE}] Supabase nicht konfiguriert, Plan nicht prüfbar`);
      return schutzAntwort(503, MELDUNG_SCHUTZ_NICHT_VERFUEGBAR, 'schutz_nicht_verfuegbar', { error: true });
    }
    let plan: PlanEntscheidung;
    try {
      plan = await pruefePlan(deps.planStore, userId, adresseNorm);
    } catch (e) {
      console.error(`[${ROUTE}] Plan-Prüfung fehlgeschlagen`, e);
      return schutzAntwort(503, MELDUNG_SCHUTZ_NICHT_VERFUEGBAR, 'schutz_nicht_verfuegbar', { error: true });
    }
    if (!plan.erlaubt) return paywallAntwort();

    // ============================================
    // 4.+5. RATE LIMIT UND KI-TAGESBUDGET
    // ============================================
    const abgelehnt = await pruefeLimitsUndBudget(req, deps, { route: ROUTE, bucket: 'analyse', ki: true, userId });
    if (abgelehnt) return abgelehnt;

    // ============================================
    // 6. GEOCODING + WORKFLOW
    // ============================================
    let geocodedDistrict: string | undefined;
    let geocodedCity: string | undefined;
    let geocodedNeighborhood: string | undefined;

    try {
      // 1. Mapbox Geocoding für Basis-Informationen
      const geoBasics = await deps.geocodeBasics(validatedPayload.address);
      geocodedCity = geoBasics.city;
      geocodedDistrict = geoBasics.district;
      geocodedNeighborhood = geoBasics.neighborhood;

      // 2. Wikidata Reverse Geocoding für zusätzliche Stadtteil-Informationen
      if (!geocodedDistrict && geoBasics.lat && geoBasics.lng) {
        const wikidataArea = await deps.wikidataAreaByPoint(geoBasics.lat, geoBasics.lng);
        if (wikidataArea) {
          geocodedDistrict = geocodedDistrict || wikidataArea.districtLabel || wikidataArea.hoodLabel;
          geocodedNeighborhood = geocodedNeighborhood || wikidataArea.hoodLabel;
        }
      }

      // Fallback: Wenn wir einen neighborhood haben aber keinen district, nutze neighborhood als district
      if (!geocodedDistrict && geocodedNeighborhood) {
        geocodedDistrict = geocodedNeighborhood;
      }

      console.log(`[${ROUTE}] Final geocoded info:`, {
        city: geocodedCity,
        district: geocodedDistrict,
        neighborhood: geocodedNeighborhood,
      });
    } catch (geocodeError) {
      console.error(`[${ROUTE}] Geocoding error (non-blocking):`, geocodeError);
      // Geocoding-Fehler sind nicht kritisch - der Agent kann trotzdem arbeiten
    }

    const enrichedPayload = {
      ...validatedPayload,
      _geocoded: {
        city: geocodedCity,
        district: geocodedDistrict,
        neighborhood: geocodedNeighborhood,
      },
    };

    const result = await deps.runWorkflow({ input_as_text: JSON.stringify(enrichedPayload) });

    // ============================================
    // 7. GRATIS-ANALYSE VERBUCHEN (nur nach Erfolg)
    // ============================================
    if (plan.art === 'gratis_neu') {
      try {
        const verbucht = await verbucheGratisAnalyse(deps.planStore, userId, analysisId, adresseNorm);
        if (verbucht === 'limit') {
          // Paralleler Aufruf hat das Kontingent für eine andere Wohnung verbraucht
          console.warn(`[${ROUTE}] Gratis-Kontingent während des Laufs vergeben, Ergebnis zurückgehalten`);
          return paywallAntwort();
        }
      } catch (e) {
        // Die Kosten sind schon entstanden; Ergebnis trotzdem ausliefern, aber laut loggen
        console.error(`[${ROUTE}] Gratis-Analyse konnte nicht verbucht werden`, e);
      }
    }

    return Response.json(
      { ...(result as Record<string, unknown>), plan: plan.art },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[${ROUTE}] error`, e);
    return Response.json(
      { error: true, message: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
