import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';

// Save scenario
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
      console.error('❌ [SCENARIOS] Supabase not configured');
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    // Prepare data for database
    const scenarioData = {
      user_id: userId,
      analysis_id: data.analysisId,
      scenario_name: data.scenarioName || 'Unbenanntes Szenario',

      // Scenario deltas/adjustments
      miete_delta_pct: parseFloat(data.mieteDeltaPct) || 0,
      preis_delta_pct: parseFloat(data.preisDeltaPct) || 0,
      zins_delta_pp: parseFloat(data.zinsDeltaPp) || 0,
      tilgung_delta_pp: parseFloat(data.tilgungDeltaPp) || 0,
      ek_delta_pct: parseFloat(data.ekDeltaPct) || 0,
      sondertilgung_jaehrlich: parseFloat(data.sondertilgungJaehrlich) || 0,

      // Scenario settings
      wertentwicklung_aktiv: Boolean(data.wertentwicklungAktiv),
      wertentwicklung_pct: parseFloat(data.wertentwicklungPct) || 0,
      darlehens_typ: data.darlehensTyp || 'annuitaet',
      miet_inflation_pct: parseFloat(data.mietInflationPct) || 0,
      kosten_inflation_pct: parseFloat(data.kostenInflationPct) || 0,
      verkaufs_nebenkosten_pct: parseFloat(data.verkaufsNebenkostenPct) || 7,

      // Calculated scenario results
      scenario_kaufpreis: parseFloat(data.scenarioKaufpreis) || 0,
      scenario_miete: parseFloat(data.scenarioMiete) || 0,
      scenario_zins: parseFloat(data.scenarioZins) || 0,
      scenario_tilgung: parseFloat(data.scenarioTilgung) || 0,
      scenario_ek: parseFloat(data.scenarioEk) || 0,
      scenario_cashflow_vor_steuer: parseFloat(data.scenarioCashflowVorSteuer) || 0,
      scenario_cashflow_nach_steuer: parseFloat(data.scenarioCashflowNachSteuer) || 0,
      scenario_nettorendite: parseFloat(data.scenarioNettorendite) || 0,
      scenario_bruttorendite: parseFloat(data.scenarioBruttorendite) || 0,
      scenario_ek_rendite: parseFloat(data.scenarioEkRendite) || 0,
      scenario_noi_monthly: parseFloat(data.scenarioNoiMonthly) || 0,
      scenario_dscr: parseFloat(data.scenarioDscr) || 0,
      scenario_rate_monat: parseFloat(data.scenarioRateMonat) || 0,
      scenario_abzahlungsjahr: parseInt(data.scenarioAbzahlungsjahr) || 0,
    };

    console.log('[SCENARIOS] Saving scenario for user:', userId, 'analysis:', data.analysisId);

    const { data: savedScenario, error } = await supabase
      .from('scenarios')
      .insert(scenarioData)
      .select()
      .single();

    if (error) {
      console.error('❌ [SCENARIOS] Error saving to Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern in der Datenbank' },
        { status: 500 }
      );
    }

    console.log('✅ [SCENARIOS] Saved successfully:', savedScenario.id);

    return NextResponse.json({
      success: true,
      scenarioId: savedScenario.id,
      message: 'Szenario gespeichert',
    });
  } catch (error) {
    console.error('Save scenario error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

// Get all scenarios for an analysis
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ scenarios: [] });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analyse-ID fehlt' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('❌ [SCENARIOS] Supabase not configured');
      return NextResponse.json({ scenarios: [] });
    }

    console.log('[SCENARIOS] Fetching scenarios for user:', userId, 'analysis:', analysisId);

    const { data: scenarios, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [SCENARIOS] Error fetching from Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Laden aus der Datenbank' },
        { status: 500 }
      );
    }

    console.log(`✅ [SCENARIOS] Found ${scenarios?.length || 0} scenarios`);

    return NextResponse.json({ scenarios: scenarios || [] });
  } catch (error) {
    console.error('Get scenarios error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    );
  }
}

// Delete scenario
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scenarioId = searchParams.get('scenarioId');

    if (!scenarioId) {
      return NextResponse.json(
        { error: 'Szenario-ID fehlt' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.error('❌ [SCENARIOS] Supabase not configured');
      return NextResponse.json(
        { error: 'Datenbank nicht konfiguriert' },
        { status: 500 }
      );
    }

    console.log('[SCENARIOS] Deleting scenario:', scenarioId, 'for user:', userId);

    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [SCENARIOS] Error deleting from Supabase:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen aus der Datenbank' },
        { status: 500 }
      );
    }

    console.log('✅ [SCENARIOS] Deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Szenario gelöscht',
    });
  } catch (error) {
    console.error('Delete scenario error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
