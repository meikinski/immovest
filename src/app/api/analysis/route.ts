import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';

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

    console.log('[ANALYSIS] Saving analysis for user:', userId);

    const { data: savedAnalysis, error } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();

    if (error) {
      console.error('❌ [ANALYSIS] Error saving to Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern in der Datenbank' },
        { status: 500 }
      );
    }

    console.log('✅ [ANALYSIS] Saved successfully:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisId: savedAnalysis.id,
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

    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
