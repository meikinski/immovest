// src/utils/compsExtract.ts
import OpenAI from 'openai';
import type { RawListing } from './compsSearch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ParsedComp = {
  type: 'rent' | 'sale';
  cold_rent_eur?: number | null;     // rent
  total_price_eur?: number | null;   // sale
  size_sqm?: number | null;
  rooms?: number | null;
  address_hint?: string | null;
  days_online?: number | null;
  link: string;
};

function schemaPrompt(type: 'rent'|'sale') {
  return `
Lies die folgenden Immobilien-Snippets (Titel + Teaser). Gib NUR ein JSON-Objekt der Form:
{"items":[
  {
    "type":"${type}",
    ${type === 'rent' ? `"cold_rent_eur": number | null,` : `"total_price_eur": number | null,`}
    "size_sqm": number | null,
    "rooms": number | null,
    "address_hint": string | null,
    "days_online": number | null,
    "link": string
  }, ...
]}
Regeln:
- Extrahiere NUR, was klar im Text steht (€, m², Zimmer, "seit X Tagen online").
- Keine Schätzungen. Fehlendes als null.
- € in Zahlen umwandeln (z. B. "1.350 €" → 1350).`.trim();
}

export async function parseComps(raw: RawListing[], type: 'rent'|'sale'): Promise<ParsedComp[]> {
  if (!raw.length) return [];
  const corpus = raw.map(r => `• ${r.title}\n${r.snippet}\n${r.link}`).join('\n\n');

  const messages = [
    { role: 'system' as const, content: 'Extrahiere strukturierte Zahlen aus Immobilienangeboten. Keine Schätzungen.' },
    { role: 'user'   as const, content: corpus },
    { role: 'user'   as const, content: schemaPrompt(type) }
  ];

  const out = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.0,
    response_format: { type: 'json_object' }
  });

  const content = out.choices[0].message?.content ?? '{"items":[]}';
  let items: ParsedComp[] = [];
  try {
    const obj = JSON.parse(content) as { items?: ParsedComp[] };
    items = (obj.items ?? []).map(x => ({ ...x, type, link: x.link }));
  } catch {
    items = [];
  }
  return items.filter(x => !!x.link);
}
