// src/app/api/scrape-with-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runUrlScraper, type UrlScraperInput } from '@/lib/urlScraperWorkflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    console.log(`[API] Scraping URL with AI Agent: ${url}`);

    const input: UrlScraperInput = { url };
    const result = await runUrlScraper(input);

    // Konvertiere zu Frontend-Format
    const data = {
      kaufpreis: result.kaufpreis || 0,
      flaeche: result.flaeche || 0,
      zimmer: result.zimmer || 0,
      baujahr: result.baujahr || undefined,
      adresse: result.adresse || '',
      miete: result.miete || 0,
      objekttyp: result.objekttyp || 'wohnung',
      _meta: {
        confidence: result.confidence,
        notes: result.notes,
        method: 'ai-agent-web-search'
      }
    };

    console.log(`[API] Scraping complete - Confidence: ${result.confidence}`);

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[API] Scraping error:', error.message);

    return NextResponse.json(
      {
        error: 'Fehler beim Laden der Daten',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
