import { NextResponse } from 'next/server';
import { getFounderOffer } from '@/lib/founderOffer';
import { mitMonitoring } from '@/lib/monitoring/apiRoute';

// Env-Variablen und Enddatum zur Laufzeit prüfen, nicht beim Build
export const dynamic = 'force-dynamic';

/** Aktuelles Angebot für die Preisanzeige (Gründerpreis aktiv oder nicht). Enthält keine Price-ID. */
async function handleGET() {
  return NextResponse.json(
    { founder: getFounderOffer() },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' } },
  );
}

export const GET = mitMonitoring('GET /api/pricing/offer', handleGET);
