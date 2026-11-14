// Täglicher Aufruf per Vercel Cron (vercel.json), damit Supabase das kostenlose Projekt
// nicht wegen Inaktivität pausiert. Pausiert ist die Datenbank nicht erreichbar und
// Premium-Kunden werden als Gratis-Nutzer angezeigt.
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { cronAutorisiert } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Vercel schickt CRON_SECRET als Bearer-Token mit. Ohne gesetztes Secret wird abgelehnt (fail closed).
  if (!cronAutorisiert(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    if (!process.env.CRON_SECRET) console.error('[Keepalive] CRON_SECRET ist nicht gesetzt, Aufruf abgelehnt');
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Supabase nicht konfiguriert' }, { status: 500 });
  }

  const { error } = await supabase
    .from('user_premium_usage')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error('[Keepalive] Supabase-Abfrage fehlgeschlagen:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
