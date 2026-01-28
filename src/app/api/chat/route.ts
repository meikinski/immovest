// src/app/api/chat/route.ts
import { streamText, convertToModelMessages } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

type UserContext = {
  kaufpreis?: number;
  miete?: number;
  eigenkapital?: number;
  zins?: number;
  tilgung?: number;
  objekttyp?: string;
  cashflow?: number;
  nettomietrendite?: number;
  bruttomietrendite?: number;
  ekRendite?: number;
  ekQuote?: number;
  dscr?: number;
  flaeche?: number;
  adresse?: string;
  hausgeld?: number;
  hausgeld_umlegbar?: number;
  grunderwerbsteuer_pct?: number;
  notar_pct?: number;
  makler_pct?: number;
  mietausfall_pct?: number;
  anschaffungskosten?: number;
  afa?: number;
  persoenlicher_steuersatz?: number;
  ruecklagen?: number;
  instandhaltungskosten_pro_qm?: number;
  aktuellerSchritt?: string;
};

function fmt(value: number | undefined, suffix: string = ''): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value === 0) {
    return '';
  }
  return value.toLocaleString('de-DE') + suffix;
}

function fmtPct(value: number | undefined): string {
  if (value === undefined || value === null || !Number.isFinite(value) || value === 0) {
    return '';
  }
  return value.toFixed(2) + '%';
}

function line(label: string, value: string): string {
  return value ? `- ${label}: ${value}` : '';
}

function buildSystemPrompt(ctx?: UserContext): string {
  if (!ctx || !ctx.kaufpreis) {
    return `Du bist ein Immobilien-Investitionsberater für imvestr.de.

Der Nutzer hat noch keine Daten eingegeben. Bitte ihn, erst die Felder im Rechner auszufüllen.
Beantworte allgemeine Fragen kurz und sachlich.

WICHTIG: Verwende NIEMALS Emojis.`;
  }

  const stepInfo = ctx.aktuellerSchritt || 'Unbekannt';

  const inputLines = [
    line('Kaufpreis', fmt(ctx.kaufpreis, ' €')),
    line('Anschaffungskosten (inkl. NK)', fmt(ctx.anschaffungskosten, ' €')),
    line('Monatl. Kaltmiete', fmt(ctx.miete, ' €')),
    line('Hausgeld gesamt', fmt(ctx.hausgeld, ' €')),
    line('Hausgeld umlagefähig', fmt(ctx.hausgeld_umlegbar, ' €')),
    line('Eigenkapital', fmt(ctx.eigenkapital, ' €')),
    line('Zinssatz', ctx.zins ? ctx.zins + '%' : ''),
    line('Tilgung', ctx.tilgung ? ctx.tilgung + '%' : ''),
    line('AfA-Satz', ctx.afa ? ctx.afa + '%' : ''),
    line('Persönlicher Steuersatz', ctx.persoenlicher_steuersatz ? ctx.persoenlicher_steuersatz + '%' : ''),
    line('Mietausfall-Risiko', ctx.mietausfall_pct ? ctx.mietausfall_pct + '%' : ''),
    line('Rücklagen', fmt(ctx.ruecklagen, ' €/Monat')),
    line('Instandhaltung', ctx.instandhaltungskosten_pro_qm ? ctx.instandhaltungskosten_pro_qm + ' €/m²' : ''),
    line('Objekttyp', ctx.objekttyp || ''),
    line('Wohnfläche', fmt(ctx.flaeche, ' m²')),
    line('GrESt', ctx.grunderwerbsteuer_pct ? ctx.grunderwerbsteuer_pct + '%' : ''),
    line('Notar', ctx.notar_pct ? ctx.notar_pct + '%' : ''),
    line('Makler', ctx.makler_pct ? ctx.makler_pct + '%' : ''),
  ].filter(Boolean).join('\n');

  const kpiLines = [
    line('Cashflow vor Steuern', fmt(ctx.cashflow, ' €/Monat')),
    line('EK-Quote', fmtPct(ctx.ekQuote)),
    line('Bruttomietrendite', fmtPct(ctx.bruttomietrendite)),
    line('Nettomietrendite', fmtPct(ctx.nettomietrendite)),
    line('Eigenkapitalrendite', fmtPct(ctx.ekRendite)),
    line('DSCR', ctx.dscr ? ctx.dscr.toFixed(2) : ''),
  ].filter(Boolean).join('\n');

  return `Du bist ein sachlicher Immobilien-Analyst für imvestr.de.

## AKTUELLE SEITE: ${stepInfo}

## EINGABEN DES NUTZERS:
${inputLines}

## BERECHNETE KENNZAHLEN:
${kpiLines}

## DEINE AUFGABE:
- Beantworte die Frage des Nutzers basierend auf EXAKT diesen Daten oben.
- Nenne konkrete Zahlen aus den Daten: "Dein Cashflow von ${fmt(ctx.cashflow, ' €')}..." statt allgemeiner Aussagen.
- Wenn der Nutzer nach einem Wert fragt, der oben steht, gib ihn direkt an.
- Erfinde KEINE Zahlen. Wenn ein Wert nicht oben steht, sage das.

## VERBOTEN:
- KEINE Emojis. Niemals. Auch keine Symbole wie 👍 📊 💰 🏠 ✓ ✅.
- KEINE Rückfragen nach Daten, die oben bereits stehen.
- KEINE erfundenen Beispielrechnungen mit anderen Zahlen.
- KEINE langen Einleitungen ("Gerne helfe ich dir...").
- KEINE Filler-Fragen am Ende ("Möchtest du...?", "Hast du noch Fragen?").

## STIL:
- Deutsch, duzen
- Kurz und direkt (2-3 Absätze max)
- Sachlich, nicht überschwänglich
- Bei Fachbegriffen: kurz erklären

## STEUER-KONTEXT (falls relevant):
- AfA senkt die steuerliche Bemessungsgrundlage, nicht den realen Cashflow
- Cashflow nach Steuern = Cashflow vor Steuern − (zu versteuernder Gewinn × Steuersatz)
- Zu versteuernder Gewinn = Mieteinnahmen − Werbungskosten − AfA − Zinsen
- Bei hoher AfA kann steuerlicher Verlust entstehen, der gegen andere Einkünfte verrechnet werden kann`;
}

export async function POST(req: Request) {
  try {
    const { messages, userContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(userContext);
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 500,
      temperature: 0.5,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return new Response('API Konfigurationsfehler', { status: 500 });
      }
    }

    return new Response('Ein Fehler ist aufgetreten. Bitte versuche es erneut.', { status: 500 });
  }
}
