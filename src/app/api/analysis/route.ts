import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { dedupeRows, isMissingColumnError, resolveAnalysisRowId, rowToListItem } from '@/lib/analysisDb';

// Save analysis
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const data = await req.json();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('❌ [ANALYSIS] Supabase not configured');
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Prepare data for database
    const analysisData = {
      user_id: userId,
      analysis_name: data.analysisName || data.adresse || 'Unbenannt',

      // Property data
      kaufpreis: parseFloat(data.kaufpreis) || 0,
      adresse: data.adresse || '',
      flaeche: parseFloat(data.flaeche) || 0,
      zimmer: parseInt(data.zimmer) || 0,
      baujahr: parseInt(data.baujahr) || 2024,

      // Financial data
      miete: parseFloat(data.miete) || 0,
      hausgeld: parseFloat(data.hausgeld) || 0,
      hausgeld_umlegbar: parseFloat(data.hausgeld_umlegbar) || 0,
      ek: parseFloat(data.ek) || 0,
      zins: parseFloat(data.zins) || 3.5,
      tilgung: parseFloat(data.tilgung) || 2,

      // Costs and taxes
      grunderwerbsteuer_pct: parseFloat(data.grunderwerbsteuer_pct) || 6.5,
      notar_pct: parseFloat(data.notar_pct) || 2,
      makler_pct: parseFloat(data.makler_pct) || 3.57,
      mietausfall_pct: parseFloat(data.mietausfall_pct) || 0,
      instandhaltungskosten_pro_qm: parseFloat(data.instandhaltungskosten_pro_qm) || 0,
      steuer: parseFloat(data.steuer) || 0,
      afa: parseFloat(data.afa) || 2,
      ruecklagen: parseFloat(data.ruecklagen) || 0,
      persoenlicher_steuersatz: parseFloat(data.persoenlicher_steuersatz) || 40,

      // Calculated values
      cashflow_operativ: parseFloat(data.cashflow_operativ) || 0,
      nettorendite: parseFloat(data.nettorendite) || 0,
      score: parseFloat(data.score) || 0,
      anschaffungskosten: parseFloat(data.anschaffungskosten) || 0,

      // AI-generated comments
      generated_comment: data.generatedComment || '',
      lage_comment: data.lageComment || '',
      mietpreis_comment: data.mietpreisComment || '',
      qm_preis_comment: data.qmPreisComment || '',
      invest_comment: data.investComment || '',
    };

    // Stabile Client-ID (siehe src/lib/analysisDb.ts)
    const clientId: string =
      typeof data.analysisId === 'string' && data.analysisId
        ? data.analysisId
        : `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const fullRow = {
      ...analysisData,
      client_id: clientId,
      // Kompletter Store-Zustand – damit beim Laden kein Feld verloren geht
      state: { ...data, analysisId: clientId },
      // Markt-Recherche (Vergleichswerte, Lage-Fakten, Quellen)
      markt_facts: data.marktFacts
        ? { facts: data.marktFacts, mietDelta: data.mietMarktDelta ?? null, kaufDelta: data.kaufMarktDelta ?? null }
        : null,
    };

    console.log('[ANALYSIS] Saving analysis for user:', userId, 'client_id:', clientId);

    // Bereits gespeichert? → aktualisieren statt neue Zeile anlegen
    const existingId = await resolveAnalysisRowId(supabase, userId, clientId);

    let { data: savedAnalysis, error } = existingId
      ? await supabase.from('analyses').update(fullRow).eq('id', existingId).eq('user_id', userId).select('id').single()
      : await supabase.from('analyses').insert(fullRow).select('id').single();

    // Neue Spalten noch nicht migriert → wie früher ohne sie speichern, statt komplett zu scheitern
    if (error && isMissingColumnError(error)) {
      console.warn('[ANALYSIS] New columns missing – saving legacy row. Run the migration in supabase-schema.sql.');
      ({ data: savedAnalysis, error } = await supabase
        .from('analyses')
        .insert(analysisData)
        .select('id')
        .single());
    }

    if (error || !savedAnalysis) {
      console.error('❌ [ANALYSIS] Error saving to Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern in der Datenbank' },
        { status: 500 }
      );
    }

    console.log('✅ [ANALYSIS] Saved successfully:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisId: clientId,     // stabile ID für Store/localStorage
      dbId: savedAnalysis.id,   // UUID (z. B. für scenarios.analysis_id)
      message: 'Analyse gespeichert',
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

// Get all analyses for user
export async function GET() {
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
