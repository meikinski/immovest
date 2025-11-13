// src/app/api/agent/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow, type WorkflowInput } from '@/lib/agentWorkflow';
import { z } from 'zod';

// ============================================
// INPUT VALIDATION SCHEMA
// ============================================

const InputPayloadSchema = z.object({
  // Basis-Objektdaten (REQUIRED)
  address: z.string().min(5, 'Adresse muss mindestens 5 Zeichen haben'),
  objektTyp: z.enum(['wohnung', 'haus', 'gewerbe']).default('wohnung'),
  kaufpreis: z.number().positive('Kaufpreis muss positiv sein'),
  flaeche: z.number().min(10, 'Fläche muss mindestens 10 m² sein'),
  zimmer: z.number().min(1, 'Mindestens 1 Zimmer erforderlich').max(20, 'Maximal 20 Zimmer'),
  baujahr: z.number().min(1800, 'Baujahr zu alt').max(new Date().getFullYear() + 2, 'Baujahr in der Zukunft').nullable().optional(),

  // Finanz-Daten (REQUIRED)
  miete: z.number().min(0, 'Miete kann nicht negativ sein'),
  hausgeld: z.number().min(0, 'Hausgeld kann nicht negativ sein').default(0),
  hausgeld_umlegbar: z.number().min(0).default(0),
  ek: z.number().min(0, 'Eigenkapital kann nicht negativ sein'),
  zins: z.number().min(0, 'Zinssatz kann nicht negativ sein').max(20, 'Zinssatz unrealistisch hoch'),
  tilgung: z.number().min(0, 'Tilgung kann nicht negativ sein').max(10, 'Tilgung unrealistisch hoch'),

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[/api/agent/run] Received request body:', {
      address: body.address ?? body.adresse,
      objektTyp: body.objektTyp,
      kaufpreis: body.kaufpreis,
      flaeche: body.flaeche,
      zimmer: body.zimmer,
    });

    // ============================================
    // 1. SCHEMA VALIDATION
    // ============================================
    let validatedPayload: InputPayload;
    try {
      const parsedData = {
        address: body.address ?? body.adresse,
        objektTyp: normalizeObjektTyp(body.objektTyp),
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

      console.log('[/api/agent/run] Parsed data before validation:', parsedData);

      // Pre-validation: Check for NaN in required fields
      const requiredFields = ['kaufpreis', 'flaeche', 'zimmer', 'zins', 'tilgung'] as const;
      const missingFields = requiredFields.filter(field => Number.isNaN(parsedData[field]));

      if (missingFields.length > 0) {
        const errorMsg = `Fehlende oder ungültige Pflichtfelder: ${missingFields.join(', ')}`;
        console.error('[/api/agent/run] Missing required fields:', missingFields);
        return NextResponse.json(
          { error: true, message: errorMsg },
          { status: 400 }
        );
      }

      if (!parsedData.address || parsedData.address.length < 5) {
        console.error('[/api/agent/run] Invalid address:', parsedData.address);
        return NextResponse.json(
          { error: true, message: 'Adresse muss mindestens 5 Zeichen haben' },
          { status: 400 }
        );
      }

      validatedPayload = InputPayloadSchema.parse(parsedData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[/api/agent/run] Validation error:', errorMessages);
        console.error('[/api/agent/run] Raw body:', JSON.stringify(body, null, 2));
        return NextResponse.json(
          { error: true, message: `Eingabe-Validierung fehlgeschlagen: ${errorMessages}` },
          { status: 400 }
        );
      }
      throw err;
    }

    // ============================================
    // 2. BUSINESS LOGIC VALIDATION
    // ============================================
    const businessValidation = validateBusinessLogic(validatedPayload);
    if (!businessValidation.valid) {
      console.warn('[/api/agent/run] Business logic warnings:', businessValidation.errors);
      // Nur warnen, nicht blocken
    }

    // ============================================
    // 3. RUN WORKFLOW
    // ============================================
    console.log('[/api/agent/run] Starting workflow with validated payload');
    const input: WorkflowInput = { input_as_text: JSON.stringify(validatedPayload) };
    const result = await runWorkflow(input);

    return NextResponse.json(result, { status: 200 });

  } catch (err: unknown) {
    const e = err as Error;
    console.error('[/api/agent/run] error', e);
    return NextResponse.json(
      { error: true, message: e.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}