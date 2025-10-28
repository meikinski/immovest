// src/app/api/scrape-with-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runUrlScraper, type UrlScraperInput } from '@/lib/urlScraperWorkflow';

/**
 * Normalisiert objekttyp auf erlaubte Werte (safety layer)
 */
function normalizeObjekttyp(rawTyp: string | null | undefined): 'wohnung' | 'haus' {
  if (!rawTyp) return 'wohnung';

  const normalized = rawTyp.toLowerCase().trim();

  // Haus variants
  if (normalized.includes('haus') || normalized.includes('efh') || normalized.includes('mfh')) {
    return 'haus';
  }

  // Default to wohnung
  return 'wohnung';
}

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
      hausgeld: result.hausgeld || 0,
      hausgeld_umlegbar: result.hausgeld_umlegbar || 0,
      // Wenn hausgeld_nicht_umlegbar nicht angegeben, berechne aus Differenz
      hausgeld_nicht_umlegbar: result.hausgeld_nicht_umlegbar ||
        ((result.hausgeld || 0) - (result.hausgeld_umlegbar || 0)),
      objekttyp: normalizeObjekttyp(result.objekttyp),
      _meta: {
        confidence: result.confidence,
        notes: result.notes,
        warnings: result.warnings || [],
        method: 'ai-agent-web-search'
      }
    };

    console.log(`[API] Scraping complete - Confidence: ${result.confidence}`);
    if (result.warnings.length > 0) {
      console.log(`[API] Warnings:`, result.warnings);
    }

    return NextResponse.json({
      success: true,
      data,
      warnings: result.warnings,
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
