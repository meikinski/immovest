// src/app/api/scrape-with-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runUrlScraper, type UrlScraperInput } from '@/lib/urlScraperWorkflow';
import { detectPortal, isLikelyRealEstateListing } from '@/lib/portalDetection';

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
  let url = '';  // Declare outside try block for error handling

  try {
    const body = await req.json();
    url = body.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    console.log(`[API] Scraping URL with AI Agent: ${url}`);

    // PORTAL DETECTION: Detect and validate portal
    const portalInfo = detectPortal(url);
    const isLikeListing = isLikelyRealEstateListing(url);

    console.log(`[API] Portal detected: ${portalInfo.name} (supported: ${portalInfo.supported}, reliability: ${portalInfo.reliability})`);

    // Collect warnings array
    const warnings: string[] = [];

    // Add portal-specific warnings
    if (!portalInfo.supported) {
      console.warn(`[API] ⚠️ Unknown portal: ${portalInfo.name}`);
      if (portalInfo.warning) {
        warnings.push(portalInfo.warning);
      }
    } else if (portalInfo.warning) {
      warnings.push(portalInfo.warning);
    }

    // Warn if URL doesn't look like a listing
    if (!isLikeListing) {
      console.warn('[API] ⚠️ URL does not look like a real estate listing');
      warnings.push('⚠️ ACHTUNG: Die URL sieht nicht wie ein typisches Immobilien-Exposé aus. Falls keine Daten gefunden werden, stelle sicher, dass du den Link zu einem einzelnen Angebot (nicht zur Übersicht) eingegeben hast.');
    }

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

    // Merge portal warnings with AI-generated warnings
    const allWarnings = [...warnings, ...result.warnings];

    console.log(`[API] Scraping complete - Portal: ${portalInfo.name}, Confidence: ${result.confidence}`);
    if (allWarnings.length > 0) {
      console.log(`[API] Warnings (${allWarnings.length}):`, allWarnings);
    }

    return NextResponse.json({
      success: true,
      data,
      warnings: allWarnings,
      _meta: {
        portal: portalInfo.name,
        portalSupported: portalInfo.supported,
        reliability: portalInfo.reliability,
      }
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('[API] ❌ Scraping error:', error.message);
    console.error('[API] Full error:', error);
    console.error('[API] Error stack:', error.stack);

    // Try to detect portal from URL even in error case
    let portalName = 'Unbekannt';
    let enhancedErrorMessage = error.message;

    try {
      const portalInfo = detectPortal(url);
      portalName = portalInfo.name;

      // Enhance error message based on portal support
      if (!portalInfo.supported) {
        enhancedErrorMessage = `❌ PORTAL NICHT UNTERSTÜTZT: ${portalName} ist noch nicht offiziell unterstützt. Die KI konnte keine verwertbaren Daten finden.\n\n💡 Tipp: Nutze einen Screenshot der Anzeige stattdessen, oder gib die Daten manuell ein.`;
      } else if (error.message.includes('Fehlende Informationen')) {
        enhancedErrorMessage = `${error.message}\n\n💡 Mögliche Ursachen:\n• Die Seite ist hinter einem Login geschützt\n• Die Anzeige ist nicht mehr verfügbar\n• Die Seitenstruktur von ${portalName} hat sich geändert\n\n🔄 Versuch es mit einem Screenshot oder manueller Eingabe.`;
      } else if (error.message.includes('keine Immobilien-Exposé-Daten')) {
        enhancedErrorMessage = `${error.message}\n\nℹ️ Du hast versucht, Daten von ${portalName} zu laden. Stelle sicher, dass:\n• Der Link zu einem einzelnen Angebot führt (nicht zur Übersicht)\n• Die Anzeige noch aktiv ist\n• Es sich um eine Verkaufsanzeige handelt (nicht Miete)`;
      }
    } catch {
      // Portal detection failed, use generic error
    }

    return NextResponse.json(
      {
        success: false,
        error: enhancedErrorMessage,  // Use enhanced message directly as error
        details: enhancedErrorMessage,  // Also provide in details for compatibility
        portal: portalName,
      },
      { status: 500 }
    );
  }
}
