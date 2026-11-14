import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { istInternerNutzer } from '@/lib/internalTraffic';

export const dynamic = 'force-dynamic';

/**
 * Für den Tracking-Helper im Browser: Ist der angemeldete Nutzer intern (INTERNAL_USER_EMAILS)?
 * Antwortet nur mit { internal: boolean }.
 */
export async function GET() {
  let internal = false;
  try {
    const { userId } = await auth();
    internal = await istInternerNutzer(userId);
  } catch { /* abgemeldet oder Clerk nicht erreichbar */ }
  return NextResponse.json({ internal }, { headers: { 'Cache-Control': 'private, no-store' } });
}
