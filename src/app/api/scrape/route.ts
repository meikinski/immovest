import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type ScrapedData = {
  kaufpreis?: number;
  flaeche?: number;
  zimmer?: number;
  baujahr?: number;
  adresse?: string;
  miete?: number;
};

const PATTERNS = {
  immoscout: {
    kaufpreis: /(\d+\.?\d*\.?\d*)\s*€/i,
    flaeche: /(\d+\.?\d*)\s*m²/i,
    zimmer: /(\d+\.?\d*)\s*Zimmer/i,
    baujahr: /Baujahr[:\s]*(\d{4})/i,
  },
  immowelt: {
    kaufpreis: /Kaufpreis[:\s]*(\d+\.?\d*\.?\d*)\s*€/i,
    flaeche: /Wohnfläche[:\s]*(\d+\.?\d*)\s*m²/i,
    zimmer: /Zimmer[:\s]*(\d+\.?\d*)/i,
    baujahr: /Baujahr[:\s]*(\d{4})/i,
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

    console.log('🔍 Scraping URL:', url);

    const portal = detectPortal(url);
    if (!portal) {
      return NextResponse.json(
        { error: 'Portal wird nicht unterstützt. Bitte nutze ImmobilienScout24 oder Immowelt.' },
        { status: 400 }
      );
    }

    console.log('✅ Portal erkannt:', portal);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Fetch failed:', response.status, response.statusText);

        // Detailliertere Fehlermeldung
        if (response.status === 403) {
          return NextResponse.json(
            {
              error: 'Zugriff verweigert. Die Website blockiert automatische Anfragen. Bitte nutze die manuelle Eingabe.',
              technicalDetails: `Status: ${response.status} - Die Website verwendet Anti-Bot-Schutz.`
            },
            { status: 400 }
          );
        } else if (response.status === 404) {
          return NextResponse.json(
            { error: 'Seite nicht gefunden. Bitte überprüfe die URL.' },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            {
              error: `Seite konnte nicht geladen werden (HTTP ${response.status})`,
              technicalDetails: response.statusText
            },
            { status: 400 }
          );
        }
      }

      const html = await response.text();
      console.log('📄 HTML Länge:', html.length, 'Zeichen');

      const data = await scrapeGeneric(html, PATTERNS[portal]);
      console.log('📊 Extrahierte Daten:', data);

      if (!data.kaufpreis && !data.flaeche && !data.zimmer) {
        return NextResponse.json(
          {
            error: 'Keine relevanten Daten gefunden. Die Seite nutzt möglicherweise ein anderes Format.',
            hint: 'Tipp: Nutze die manuelle Eingabe für zuverlässigere Ergebnisse.'
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, data });
    } catch (fetchError) {
      console.error('❌ Fetch Error:', fetchError);

      return NextResponse.json(
        {
          error: 'Verbindung zur Website fehlgeschlagen',
          technicalDetails: fetchError instanceof Error ? fetchError.message : 'Netzwerkfehler',
          hint: 'Die Website könnte Anti-Bot-Schutz verwenden oder nicht erreichbar sein. Bitte nutze die manuelle Eingabe.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Scraping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scraping fehlgeschlagen' },
      { status: 500 }
    );
  }
}