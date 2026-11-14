// src/app/api/scrape-with-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runUrlScraper, type UrlScraperInput } from '@/lib/urlScraperWorkflow';
import { detectPortal, isLikelyRealEstateListing } from '@/lib/portalDetection';
import { bereinigeHinweise, pruefeImport } from '@/lib/importPruefung';
import { mitMonitoring } from '@/lib/monitoring/apiRoute';

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

async function handlePOST(req: NextRequest) {
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

    // Early exit for unknown portals
    if (!portalInfo.supported) {
      console.warn(`[API] ❌ Portal not supported: ${portalInfo.name}`);
      return NextResponse.json(
        {
          success: false,
          error: portalInfo.warning || `Portal "${portalInfo.name}" wird aktuell nicht unterstützt.`,
          details: portalInfo.warning || `Portal "${portalInfo.name}" wird aktuell nicht unterstützt.`,
          portal: portalInfo.name,
        },
        { status: 400 }
      );
    }

    // Collect warnings array
    const warnings: string[] = [];

    // Add portal-specific warnings
    if (portalInfo.warning) {
      warnings.push(portalInfo.warning);
    }

    // Warn if URL doesn't look like a listing
    if (!isLikeListing) {
      console.warn('[API] ⚠️ URL does not look like a real estate listing');
      warnings.push('⚠️ ACHTUNG: Die URL sieht nicht wie ein typisches Immobilien-Exposé aus. Falls keine Daten gefunden werden, stelle sicher, dass du den Link zu einem einzelnen Angebot (nicht zur Übersicht) eingegeben hast.');
    }

    const input: UrlScraperInput = { url };
    // Fehlende Angaben und Platzhalter (z. B. 1 € bei "Preis auf Anfrage") bleiben leer und werden benannt
    const { daten: result, fehlend } = pruefeImport(await runUrlScraper(input));

    // Konvertiere zu Frontend-Format
    const data: Record<string, unknown> = {
      kaufpreis: result.kaufpreis || 0,
      flaeche: result.flaeche || 0,
      zimmer: result.zimmer || 0,
      baujahr: result.baujahr || 0,
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
        method: portalInfo.name === 'ImmobilienScout24' ? 'immoscout-mobile-api' : 'ai-agent-web-search'
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
      // Fehlende Angaben (Feldschlüssel) und Hinweise in Anzeigeform für die Eingabeseiten
      fehlend,
      hinweise: bereinigeHinweise(allWarnings, fehlend),
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

      // Technische Fehler in eine klare Ursache übersetzen. Die Alternativen (Foto/Screenshot scannen,
      // manuelle Eingabe) bietet die Eingabeseite bei jedem fehlgeschlagenen Import einheitlich an.
      if (!portalInfo.supported) {
        enhancedErrorMessage = `Portal "${portalName}" wird beim Link-Import noch nicht unterstützt.`;
      } else if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('blocked') || error.message.includes('Browser-Automation ist in dieser Umgebung nicht verfügbar')) {
        enhancedErrorMessage = `Die Anzeige von ${portalName} konnte gerade nicht abgerufen werden. Versuch es in ein paar Minuten nochmal.`;
      } else if (error.message.includes('keine Immobilien-Exposé-Daten')) {
        enhancedErrorMessage = 'Keine Daten gefunden. Stelle sicher, dass der Link zu einem einzelnen Angebot führt.';
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

export const POST = mitMonitoring('POST /api/scrape-with-agent', handlePOST);
