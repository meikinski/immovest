import { NextResponse } from 'next/server';
import { getFounderOffer } from '@/lib/founderOffer';

// Env-Variablen und Enddatum zur Laufzeit prüfen, nicht beim Build
export const dynamic = 'force-dynamic';

/** Aktuelles Angebot für die Preisanzeige (Gründerpreis aktiv oder nicht). Enthält keine Price-ID. */
export async function GET() {
  return NextResponse.json(
    { founder: getFounderOffer() },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' } },
  );
}
