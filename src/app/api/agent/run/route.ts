// src/app/api/agent/run/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runWorkflow, type WorkflowInput } from '@/lib/agentWorkflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Payload mit ALLEN Daten inkl. berechnete KPIs
    const payload = {
      // Basis-Objektdaten
      address: body.address ?? body.adresse ?? '',
      objektTyp: body.objektTyp ?? 'wohnung',
      kaufpreis: Number(body.kaufpreis) || 0,
      flaeche: Number(body.flaeche) || 0,
      zimmer: Number(body.zimmer) || 0,
      baujahr: Number(body.baujahr) || null,
      
      // Finanz-Daten
      miete: Number(body.miete) || 0,
      hausgeld: Number(body.hausgeld) || 0,
      hausgeld_umlegbar: Number(body.hausgeld_umlegbar) || 0,
      ek: Number(body.ek) || 0,
      zins: Number(body.zins) || 0,
      tilgung: Number(body.tilgung) || 0,

      // ⚡ NEU: Berechnete KPIs aus der App übergeben
      cashflowVorSteuer: Number(body.cashflowVorSteuer) || 0,
      cashflowNachSteuern: Number(body.cashflowNachSteuern) || null,
      nettoMietrendite: Number(body.nettoMietrendite) || 0,
      bruttoMietrendite: Number(body.bruttoMietrendite) || 0,
      ekRendite: Number(body.ekRendite) || 0,
      dscr: Number(body.dscr) || null,
      anschaffungskosten: Number(body.anschaffungskosten) || 0,
    };

    const input: WorkflowInput = { input_as_text: JSON.stringify(payload) };
    const result = await runWorkflow(input);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[/api/agent/run] error', e);
    return NextResponse.json(
      { error: true, message: e.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}