import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { dedupeRows, isMissingColumnError, rowToListItem, saveAnalysisRow } from '@/lib/analysisDb';
import { meldeUrsache, mitMonitoring } from '@/lib/monitoring/apiRoute';

// Save analysis
async function handlePOST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const data = await req.json().catch(() => null);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('❌ [ANALYSIS] Supabase not configured');
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    console.log('[ANALYSIS] Saving analysis for user:', userId);

    // Zuordnung, Fallbacks und Logging des echten Datenbankfehlers: src/lib/analysisDb.ts
    const ergebnis = await saveAnalysisRow(supabase, userId, data);

    if (!ergebnis.ok) {
      // Der echte Fehler steht nur im Server-Log, nie in der Antwort
      console.error('❌ [ANALYSIS] Speichern endgültig fehlgeschlagen:', {
        code: ergebnis.error?.code, message: ergebnis.error?.message,
        details: ergebnis.error?.details, hint: ergebnis.error?.hint,
        fallbacks: ergebnis.hinweise, userId, clientId: ergebnis.clientId,
      });
      // Nur technische Angaben an die Überwachung: Fehlercode und -text der Datenbank, keine Eingaben
      await meldeUrsache('POST /api/analysis', new Error(`Supabase: ${ergebnis.error?.code ?? 'ohne Code'} ${ergebnis.error?.message ?? ''}`.trim()), {
        db_code: ergebnis.error?.code ?? null,
        fallbacks: ergebnis.hinweise.length,
      });
      return NextResponse.json(
        { error: 'Fehler beim Speichern in der Datenbank' },
        { status: 500 }
      );
    }
    const clientId = ergebnis.clientId;
    const savedAnalysis = { id: ergebnis.dbId };

    console.log('✅ [ANALYSIS] Saved successfully:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisId: clientId,     // stabile ID für Store/localStorage
      dbId: savedAnalysis.id,   // UUID (z. B. für scenarios.analysis_id)
      message: 'Analyse gespeichert',
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    await meldeUrsache('POST /api/analysis', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

// Get all analyses for user
async function handleGET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ analyses: [] });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('❌ [ANALYSIS] Supabase not configured');
      return NextResponse.json({ analyses: [] });
    }

    console.log('[ANALYSIS] Fetching analyses for user:', userId);

    const listColumns =
      'id, analysis_name, created_at, updated_at, kaufpreis, adresse, flaeche, zimmer, nettorendite, cashflow_operativ';

    let { data: rows, error } = await supabase
      .from('analyses')
      .select(`${listColumns}, client_id`)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // client_id noch nicht migriert
    if (error && isMissingColumnError(error)) {
      ({ data: rows, error } = await supabase
        .from('analyses')
        .select(listColumns)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }) as unknown as { data: typeof rows; error: typeof error });
    }

    const analyses = dedupeRows((rows ?? []) as Record<string, unknown>[]).map(rowToListItem);

    if (error) {
      console.error('❌ [ANALYSIS] Error fetching from Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden aus der Datenbank' },
        { status: 500 }
      );
    }

    console.log(`✅ [ANALYSIS] Found ${analyses?.length || 0} analyses`);

    return NextResponse.json({ analyses: analyses || [] });
  } catch (error) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    );
  }
}

export const POST = mitMonitoring('POST /api/analysis', handlePOST);
export const GET = mitMonitoring('GET /api/analysis', handleGET);
