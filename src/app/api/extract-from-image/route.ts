import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ExtractedData = {
  kaufpreis?: number;
  flaeche?: number;
  zimmer?: number;
  baujahr?: number;
  adresse?: string;
  miete?: number;
  hausgeld?: number;
  hausgeld_umlegbar?: number;
  hausgeld_nicht_umlegbar?: number;
  objekttyp?: 'wohnung' | 'haus' | 'mfh';
  anzahl_wohneinheiten?: number;
  verwaltungskosten?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageUrl } = await req.json() as {
      imageBase64?: string;
      imageUrl?: string;
    };

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: 'Bild (Base64 oder URL) ist erforderlich' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key nicht konfiguriert' },
        { status: 500 }
      );
    }

    console.log('🖼️ Analysiere Bild mit GPT-4 Vision...');

    const imageContent = imageBase64
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysiere dieses Immobilien-Inserat und extrahiere folgende Informationen:

- Kaufpreis (in €, nur Zahl)
- Wohnfläche (in m², nur Zahl)
- Anzahl Zimmer (nur Zahl, z.B. 3.5)
- Baujahr (nur Jahreszahl)
- Adresse (vollständig mit PLZ und Ort)
- Kaltmiete falls angegeben (in €/Monat, nur Zahl) - bei MFH die Gesamtmiete aller Einheiten
- Hausgeld/Nebenkosten (in €/Monat, nur Zahl) - nur bei Eigentumswohnungen
- Objekttyp: "wohnung" (Eigentumswohnung), "haus" (Einfamilienhaus), oder "mfh" (Mehrfamilienhaus)
- Anzahl Wohneinheiten - nur bei MFH

OBJEKTTYP-ERKENNUNG:
- "Wohnung", "ETW", "Eigentumswohnung" → objekttyp = "wohnung"
- "Mehrfamilienhaus", "MFH", "Renditeobjekt", "Zinshaus" → objekttyp = "mfh"
- "Einfamilienhaus", "EFH", "Haus" → objekttyp = "haus"

WICHTIG: Achte darauf, Kaltmiete und Hausgeld nicht zu verwechseln!
- Kaltmiete ist normalerweise der größere Wert
- Hausgeld/Nebenkosten ist normalerweise der kleinere Wert
- Bei Haus/MFH gibt es oft KEIN Hausgeld

HAUSGELD (nur bei Eigentumswohnungen):
- Falls eine Aufteilung in "umlegbar"/"nicht umlegbar" sichtbar ist:
  → Extrahiere "hausgeld_umlegbar" und "hausgeld_nicht_umlegbar" separat
- Falls nur Gesamt-Hausgeld sichtbar ist:
  → Extrahiere nur "hausgeld" (die Aufteilung wird automatisch berechnet)

MEHRFAMILIENHAUS (MFH):
- Extrahiere "anzahl_wohneinheiten" falls sichtbar (z.B. "5 Wohneinheiten")
- Die Miete sollte die Gesamtmiete aller Einheiten sein

Antworte NUR mit einem JSON-Objekt. Beispiele:

Eigentumswohnung:
{
  "kaufpreis": 350000,
  "flaeche": 85.5,
  "zimmer": 3.5,
  "baujahr": 2015,
  "adresse": "Musterstraße 10, 10115 Berlin",
  "miete": 1200,
  "hausgeld": 250,
  "hausgeld_umlegbar": 150,
  "hausgeld_nicht_umlegbar": 100,
  "objekttyp": "wohnung"
}

Mehrfamilienhaus:
{
  "kaufpreis": 850000,
  "flaeche": 420,
  "baujahr": 1995,
  "adresse": "Hauptstraße 5, 50667 Köln",
  "miete": 4800,
  "anzahl_wohneinheiten": 6,
  "objekttyp": "mfh"
}

Wenn ein Wert nicht gefunden wird, lasse ihn weg. Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageContent!,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von OpenAI erhalten');
    }

    console.log('🤖 OpenAI Response:', content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error: 'Das Bild konnte nicht analysiert werden',
          hint: 'Bitte stelle sicher, dass das Bild ein deutlich lesbares Immobilien-Inserat zeigt. Versuche es mit einem klareren Foto oder besserer Beleuchtung.',
        },
        { status: 400 }
      );
    }

    let data: ExtractedData;
    try {
      data = JSON.parse(jsonMatch[0]) as ExtractedData;
    } catch {
      return NextResponse.json(
        {
          error: 'Die extrahierten Daten konnten nicht verarbeitet werden',
          hint: 'Das Bild enthält möglicherweise unvollständige oder unleserliche Informationen. Versuche es mit einem anderen Foto.',
        },
        { status: 400 }
      );
    }

    // Validierung
    if (!data.kaufpreis && !data.flaeche && !data.zimmer) {
      return NextResponse.json(
        {
          error: 'Keine relevanten Immobiliendaten im Bild gefunden',
          hint: 'Stelle sicher, dass das Bild ein Immobilien-Inserat mit deutlich sichtbaren Angaben zeigt.',
        },
        { status: 400 }
      );
    }

    console.log('✅ Extrahierte Daten:', data);

    // Hausgeld-Split-Logik (wie beim URL-Scraper)
    const warnings: string[] = [];

    if (data.hausgeld && data.hausgeld > 0) {
      // Fall 1: Split wurde gefunden
      if (data.hausgeld_umlegbar && data.hausgeld_nicht_umlegbar) {
        console.log('✅ Hausgeld-Split gefunden');
      }
      // Fall 2: Nur Gesamt-Hausgeld gefunden → 60/40 Aufteilung
      else {
        data.hausgeld_umlegbar = Math.round(data.hausgeld * 0.6);
        data.hausgeld_nicht_umlegbar = Math.round(data.hausgeld * 0.4);
        warnings.push('Hausgeld-Verteilung ist Schätzung (60/40)');
        console.log('⚠️ Hausgeld-Split geschätzt (60/40)');
      }
    }

    return NextResponse.json({ success: true, data, warnings });
  } catch (error) {
    console.error('❌ Image extraction error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API nicht konfiguriert. Bitte nutze die manuelle Eingabe.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bildanalyse fehlgeschlagen' },
      { status: 500 }
    );
  }
}
