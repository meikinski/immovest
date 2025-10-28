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
  objekttyp?: 'wohnung' | 'haus';
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
- Kaltmiete falls angegeben (in €, nur Zahl)
- Objekttyp (nur "wohnung" oder "haus")

Antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "kaufpreis": 350000,
  "flaeche": 85.5,
  "zimmer": 3.5,
  "baujahr": 2015,
  "adresse": "Musterstraße 10, 10115 Berlin",
  "miete": 1200,
  "objekttyp": "wohnung"
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
      throw new Error('Ungültiges JSON in der Antwort');
    }

    const data = JSON.parse(jsonMatch[0]) as ExtractedData;

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

    return NextResponse.json({ success: true, data });
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
