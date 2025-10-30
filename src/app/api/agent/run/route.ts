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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ============================================
    // 1. SCHEMA VALIDATION
    // ============================================
    let validatedPayload: InputPayload;
    try {
      validatedPayload = InputPayloadSchema.parse({
        address: body.address ?? body.adresse,
        objektTyp: normalizeObjektTyp(body.objektTyp),
        kaufpreis: Number(body.kaufpreis),
        flaeche: Number(body.flaeche),
        zimmer: Number(body.zimmer),
        baujahr: body.baujahr ? Number(body.baujahr) : null,
        miete: Number(body.miete),
        hausgeld: Number(body.hausgeld),
        hausgeld_umlegbar: Number(body.hausgeld_umlegbar),
        ek: Number(body.ek),
        zins: Number(body.zins),
        tilgung: Number(body.tilgung),
        cashflowVorSteuer: body.cashflowVorSteuer ? Number(body.cashflowVorSteuer) : undefined,
        cashflowNachSteuern: body.cashflowNachSteuern ? Number(body.cashflowNachSteuern) : undefined,
        nettoMietrendite: body.nettoMietrendite ? Number(body.nettoMietrendite) : undefined,
        bruttoMietrendite: body.bruttoMietrendite ? Number(body.bruttoMietrendite) : undefined,
        ekRendite: body.ekRendite ? Number(body.ekRendite) : undefined,
        dscr: body.dscr ? Number(body.dscr) : undefined,
        anschaffungskosten: body.anschaffungskosten ? Number(body.anschaffungskosten) : undefined,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('[/api/agent/run] Validation error:', errorMessages);
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

    // DEBUG: Log what we're about to return
    console.log('📤 API Response Structure:', {
      hasAnalyse: !!result.analyse,
      hasInvest: !!result.invest,
      lageLength: result.analyse?.lage?.html?.length || 0,
      mieteLength: result.analyse?.miete?.html?.length || 0,
      kaufLength: result.analyse?.kauf?.html?.length || 0,
      investLength: result.invest?.html?.length || 0,
    });

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