import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { resolveAnalysisRowId, rowToState } from '@/lib/analysisDb';

// Get single analysis (id = Client-analysisId oder UUID)
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Datenbank nicht konfiguriert' }, { status: 500 });
    }

    const rowId = await resolveAnalysisRowId(supabase, userId, id);
    if (!rowId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: row, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', rowId)
      .eq('user_id', userId)
      .single();

    if (error || !row) {
      console.error('❌ [ANALYSIS] Error loading analysis:', error);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ analysis: rowToState(row) });
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    );
  }
}

// Delete analysis (inkl. Szenarien per ON DELETE CASCADE)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Datenbank nicht konfiguriert' }, { status: 500 });
    }

    const rowId = await resolveAnalysisRowId(supabase, userId, id);
    if (!rowId) {
      // Nur lokal vorhanden – nichts zu tun
      return NextResponse.json({ success: true });
    }

    const { data: row } = await supabase
      .from('analyses')
      .select('adresse, kaufpreis')
      .eq('id', rowId)
      .eq('user_id', userId)
      .single();

    // Die Zeile selbst, weitere Zeilen derselben client_id und alte Duplikate ohne client_id
    // (in der Liste über Adresse + Kaufpreis zusammengefasst, siehe dedupeRows) löschen
    const deletes = [
      supabase.from('analyses').delete().eq('user_id', userId).eq('id', rowId),
      supabase.from('analyses').delete().eq('user_id', userId).eq('client_id', id),
    ];
    if (row) {
      deletes.push(
        supabase.from('analyses').delete()
          .eq('user_id', userId)
          .is('client_id', null)
          .eq('adresse', row.adresse)
          .eq('kaufpreis', row.kaufpreis)
      );
    }
    const results = await Promise.all(deletes);
    // Fehler bei client_id-Filtern ignorieren, falls die Spalte noch nicht migriert ist
    const error = results[0].error;

    if (error) {
      console.error('❌ [ANALYSIS] Error deleting analysis:', error);
      return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
