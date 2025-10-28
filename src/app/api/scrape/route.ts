import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type ScrapedData = {
  kaufpreis?: number;
  flaeche?: number;
  zimmer?: number;
  baujahr?: number;
  adresse?: string;
  miete?: number;
  hausgeld?: number;
  makler_pct?: number;
};

const PATTERNS = {
  immoscout: {
    kaufpreis: /Kaufpreis[:\s]*(\d+\.?\d*\.?\d*)\s*€|(\d+\.?\d*\.?\d*)\s*€/i,
    flaeche: /(\d+\.?\d*)\s*m²/i,
    zimmer: /(\d+\.?\d*)\s*Zimmer/i,
    baujahr: /Baujahr[:\s]*(\d{4})/i,
    kaltmiete: /Kaltmiete[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    hausgeld: /Hausgeld[:\s]*(\d+\.?\d*\.?\d*)\s*€|Nebenkosten[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    makler: /Provision[:\s]*(\d+[,.]?\d*)\s*%|Makler[:\s]*(\d+[,.]?\d*)\s*%|Courtage[:\s]*(\d+[,.]?\d*)\s*%/i,
  },
  immowelt: {
    kaufpreis: /Kaufpreis[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    flaeche: /Wohnfläche[:\s]*(\d+\.?\d*)\s*m²/i,
    zimmer: /Zimmer[:\s]*(\d+\.?\d*)/i,
    baujahr: /Baujahr[:\s]*(\d{4})/i,
    kaltmiete: /Kaltmiete[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    hausgeld: /Hausgeld[:\s]*(\d+\.?\d*\.?\d*)\s*€|Nebenkosten[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    makler: /Provision[:\s]*(\d+[,.]?\d*)\s*%|Makler[:\s]*(\d+[,.]?\d*)\s*%|Courtage[:\s]*(\d+[,.]?\d*)\s*%/i,
  },
};

function detectPortal(url: string): keyof typeof PATTERNS | null {
  if (url.includes('immobilienscout24')) return 'immoscout';
  if (url.includes('immowelt')) return 'immowelt';
  return null;
}

function extractNumber(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (!match || !match[1]) return undefined;
  
  const cleaned = match[1].replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

async function scrapeGeneric(html: string, patterns: typeof PATTERNS.immoscout): Promise<ScrapedData> {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const data: ScrapedData = {
    kaufpreis: extractNumber(text, patterns.kaufpreis),
    flaeche: extractNumber(text, patterns.flaeche),
    zimmer: extractNumber(text, patterns.zimmer),
    baujahr: extractNumber(text, patterns.baujahr),
  };

  // Kaltmiete extrahieren (priorisiert vor allgemeiner Miete)
  if ('kaltmiete' in patterns) {
    const kaltmiete = extractNumber(text, patterns.kaltmiete);
    if (kaltmiete) {
      data.miete = kaltmiete;
    }
  }

  // Hausgeld extrahieren
  if ('hausgeld' in patterns) {
    const hausgeld = extractNumber(text, patterns.hausgeld);
    if (hausgeld) {
      data.hausgeld = hausgeld;
    }
  }

  // Maklergebühr extrahieren (als Prozentsatz)
  if ('makler' in patterns) {
    const maklerPct = extractNumber(text, patterns.makler);
    if (maklerPct) {
      data.makler_pct = maklerPct;
    }
  }

  // Adresse versuchen zu extrahieren
  const addressSelectors = [
    'meta[property="og:street-address"]',
    '.address-block',
    '[data-qa="objectAddress"]',
    '.location'
  ];

  for (const selector of addressSelectors) {
    const addr = $(selector).attr('content') || $(selector).text().trim();
    if (addr) {
      data.adresse = addr;
      break;
    }
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string };

    if (!url) {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    const portal = detectPortal(url);
    if (!portal) {
      return NextResponse.json(
        { error: 'Portal wird nicht unterstützt. Bitte nutze ImmobilienScout24 oder Immowelt.' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error('Seite konnte nicht geladen werden');
    }

    const html = await response.text();
    const data = await scrapeGeneric(html, PATTERNS[portal]);

    if (!data.kaufpreis && !data.flaeche) {
      return NextResponse.json(
        { error: 'Keine relevanten Daten gefunden. Bitte prüfe die URL.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping fehlgeschlagen' },
      { status: 500 }
    );
  }
}