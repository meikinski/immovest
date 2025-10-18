// src/app/api/price/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { summarizePurchase, type PriceBasis, type PriceComp } from '@/utils/price';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { basis: PriceBasis; comps: PriceComp[] };
    if (!body?.basis?.radius_km || !Array.isArray(body?.comps)) {
      return NextResponse.json({ error: 'basis.radius_km und comps[] sind erforderlich.' }, { status: 400 });
    }
    const summary = await summarizePurchase(body.basis, body.comps);
    return NextResponse.json(summary);
  } catch (e) {
    console.error('purchase route error', e);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

/**
 * Beispiel-Request:
 * POST /api/price/purchase
 * {
 *   "basis": { "plz":"35435", "radius_km": 5, "ort":"Wettenberg", "kontext":"kleinstädtisch" },
 *   "comps": [
 *     { "titel":"ETW", "wohnfl": 62, "kaufpreis": 189000, "dist_km": 2.1, "quelle":"IS24" },
 *     { "titel":"ETW saniert", "wohnfl": 58, "kaufpreis": 210000, "eur_qm": 3620, "dist_km": 1.2, "quelle":"IS24" }
 *   ]
 * }
 */
