// src/app/api/price/rent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { summarizeRent, type PriceBasis, type PriceComp } from '@/utils/price';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { basis: PriceBasis; comps: PriceComp[] };
    if (!body?.basis?.radius_km || !Array.isArray(body?.comps)) {
      return NextResponse.json({ error: 'basis.radius_km und comps[] sind erforderlich.' }, { status: 400 });
    }
    const summary = await summarizeRent(body.basis, body.comps);
    return NextResponse.json(summary);
  } catch (e) {
    console.error('rent route error', e);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

/**
 * Beispiel-Request:
 * POST /api/price/rent
 * {
 *   "basis": { "plz":"50672", "radius_km": 2, "ort":"Neustadt-Nord, Köln", "kontext":"innerstädtisch" },
 *   "comps": [
 *     { "titel":"1ZKB", "wohnfl": 35, "kaltmiete": 700, "eur_qm": 20, "dist_km": 0.4, "quelle":"IS24" },
 *     { "titel":"2ZKB", "wohnfl": 48, "kaltmiete": 960, "dist_km": 0.7, "quelle":"IS24" }
 *   ]
 * }
 */
