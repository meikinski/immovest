// Debug endpoint to test the ImmoScout24 mobile API from the deployed environment
// Usage (logged in): /api/debug/immoscout?url=https://www.immobilienscout24.de/expose/169364993
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  collectLabeledValues,
  extractImmoscoutExposeId,
  fetchImmoscoutExpose,
} from '@/lib/immoscoutMobileApi';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  const input = req.nextUrl.searchParams.get('url') ?? req.nextUrl.searchParams.get('id') ?? '';
  const exposeId = extractImmoscoutExposeId(input);
  if (!exposeId) {
    return NextResponse.json(
      { error: 'Ungültiger Link. Erwartet: https://www.immobilienscout24.de/expose/<id>' },
      { status: 400 }
    );
  }

  const result = await fetchImmoscoutExpose(exposeId);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? 'local',
    ...result,
    labeledValues: result.success ? collectLabeledValues(result.data) : undefined,
  });
}
