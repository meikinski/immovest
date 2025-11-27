// src/app/api/scrape-with-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runUrlScraper, type UrlScraperInput } from '@/lib/urlScraperWorkflow';

/**
 * Normalisiert objekttyp auf erlaubte Werte (safety layer)
 */
function normalizeObjekttyp(rawTyp: string | null | undefined): 'wohnung' | 'haus' | 'mfh' {
  if (!rawTyp) return 'wohnung';

  const normalized = rawTyp.toLowerCase().trim();

  // MFH variants (check first, more specific)
  if (normalized.includes('mfh') ||
      normalized.includes('mehrfamilienhaus') ||
      normalized.includes('mehrfamilien') ||
      normalized.includes('renditeobjekt') ||
      normalized.includes('zinshaus')) {
    return 'mfh';
  }

  // Haus variants (EFH)
  if (normalized.includes('haus') || normalized.includes('efh') || normalized.includes('einfamilienhaus')) {
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
    const data: Record<string, unknown> = {
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
      anzahl_wohneinheiten: result.anzahl_wohneinheiten || 0,
      // Bei Haus/MFH: hausgeld_nicht_umlegbar wird als verwaltungskosten interpretiert
      verwaltungskosten: (normalizeObjekttyp(result.objekttyp) !== 'wohnung')
        ? (result.hausgeld_nicht_umlegbar || 0)
        : 0,
      _meta: {
        confidence: result.confidence,
        notes: result.notes,
        warnings: result.warnings || [],
        method: 'ai-agent-web-search'
      }
    };

    // CRITICAL: Map maklergebuehr (percentage from scraper) to makler_pct (store field)
    // Only override default if it was found in listing
    // If null, don't send it - let frontend use store default (3.57%)
    if (result.maklergebuehr !== null && result.maklergebuehr !== undefined) {
      data.makler_pct = result.maklergebuehr;  // Store expects makler_pct, not maklergebuehr
    }

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
