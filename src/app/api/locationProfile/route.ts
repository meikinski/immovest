import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildLocationProfilePrompt, Morphologie, LocationProfileInput } from '@/utils/locationProfile';

export const dynamic = 'force-dynamic';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      address: string;
      object?: { baujahr?: number; typ?: string; zimmer?: number; flaeche?: number };
      snippets?: Array<{ title?: string; text: string } | string>;
      compact?: boolean;
      morph?: Morphologie | 'auto' | null;
      model?: string;
    };
    if (!body?.address) return NextResponse.json({ error: 'address required' }, { status: 400 });

    const { system, user } = buildLocationProfilePrompt({
      address: body.address,
      object: body.object,
      snippets: body.snippets,
      compact: body.compact ?? false,
      morph: body.morph ?? 'auto',
    } as LocationProfileInput);

    const completion = await openai.chat.completions.create({
      model: body.model ?? 'gpt-4o-mini',
      temperature: 0.6,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    });

    const text = completion.choices[0]?.message?.content?.trim() || 'Keine Einschätzung generiert.';
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
