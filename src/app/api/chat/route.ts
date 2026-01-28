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
  anschaffungskosten?: number;
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

/** Build a bullet only when value is present */
function line(label: string, value: string): string {
  return value ? `- ${label}: ${value}` : '';
}

function buildSystemPrompt(ctx?: UserContext): string {
  // If no data at all, short-circuit
  if (!ctx || !ctx.kaufpreis) {
    return `Du bist ein erfahrener deutscher Immobilien-Investitionsberater für imvestr.de.

Der Nutzer hat noch keine Immobiliendaten eingegeben.
Bitte ihn freundlich, erst Kaufpreis, Miete und Finanzierung im Rechner einzutragen, damit du konkret helfen kannst.
Beantworte allgemeine Fragen zu Immobilien-Investment trotzdem gerne.
Antworte IMMER auf Deutsch. Halte Antworten kompakt (max. 2-3 kurze Absätze).`;
  }

  // Build only lines that have real values
  const dataLines = [
    line('Kaufpreis', fmt(ctx.kaufpreis, ' €')),
    line('Anschaffungskosten (inkl. NK)', fmt(ctx.anschaffungskosten, ' €')),
    line('Monatl. Kaltmiete', fmt(ctx.miete, ' €')),
    line('Eigenkapital', fmt(ctx.eigenkapital, ' €')),
    line('EK-Quote', fmtPct(ctx.ekQuote)),
    line('Zinssatz', ctx.zins ? ctx.zins + '%' : ''),
    line('Tilgung', ctx.tilgung ? ctx.tilgung + '%' : ''),
    line('Hausgeld', fmt(ctx.hausgeld, ' €/Monat')),
    line('Objekttyp', ctx.objekttyp || ''),
    line('Wohnfläche', fmt(ctx.flaeche, ' m²')),
    line('Adresse', ctx.adresse || ''),
    line('Grunderwerbsteuer', ctx.grunderwerbsteuer_pct ? ctx.grunderwerbsteuer_pct + '%' : ''),
    line('Notar', ctx.notar_pct ? ctx.notar_pct + '%' : ''),
    line('Makler', ctx.makler_pct ? ctx.makler_pct + '%' : ''),
  ].filter(Boolean).join('\n');

  const kpiLines = [
    line('Cashflow (monatl.)', fmt(ctx.cashflow, ' €')),
    line('Bruttomietrendite', fmtPct(ctx.bruttomietrendite)),
    line('Nettomietrendite', fmtPct(ctx.nettomietrendite)),
    line('Eigenkapitalrendite', fmtPct(ctx.ekRendite)),
    line('DSCR', ctx.dscr ? ctx.dscr.toFixed(2) : ''),
  ].filter(Boolean).join('\n');

  const stepInfo = ctx.aktuellerSchritt || 'Unbekannt';

  return `Du bist ein erfahrener deutscher Immobilien-Investitionsberater für imvestr.de.

## WO SICH DER NUTZER GERADE BEFINDET:
Aktuelle Seite: ${stepInfo}

Der Rechner hat folgende Schritte:
- Schritt A: Kaufpreis & Nebenkosten eingeben
- Schritt B: Miete & Bewirtschaftungskosten eingeben
- Schritt C: Finanzierung (Eigenkapital, Zinssatz, Tilgung) eingeben
- Tabs: Ergebnis-Analyse mit KPIs, Markt & Lage, Prognose, Szenarien

Passe deine Antworten an den aktuellen Schritt an:
- Auf Schritt A/B/C: Der Nutzer füllt gerade das Formular aus. Hilf bei Verständnisfragen zu den Feldern auf dieser Seite. Fehlende Daten aus späteren Schritten sind normal — nicht bemängeln.
- Auf Tabs: Alle Daten sind eingegeben. Du kannst die volle Analyse nutzen.

## AKTUELLE DATEN DES NUTZERS (aus dem Rechner — live):
${dataLines}

## BERECHNETE KPIs:
${kpiLines}

## KRITISCHE REGEL:
Die Daten oben kommen direkt aus dem Rechner des Nutzers. Du HAST bereits alle eingegebenen Werte.
- Frage NIEMALS nach Werten, die oben bereits stehen.
- Beziehe dich IMMER konkret auf die vorhandenen Zahlen ("Dein Cashflow von X €...", "Bei deiner EK-Quote von Y%...").
- Wenn ein Wert oben fehlt (= nicht aufgelistet), dann wurde er noch nicht eingegeben — nur dann darfst du nachfragen.

## BENCHMARK-WERTE DEUTSCHLAND 2025:
- Bruttomietrendite: <3% schwach, 3-4% solide, >4% gut, >5% sehr gut
- Nettomietrendite: <2% schwach, 2-3% solide, >3% attraktiv
- Eigenkapitalrendite: <5% niedrig, 5-8% durchschnittlich, >8% gut, >12% sehr gut
- DSCR: <1.0 kritisch, 1.0-1.2 knapp, >1.2 gut, >1.5 sehr gut
- Cashflow: negativ = Zuzahlung, 0-100€ knapp, >100€ solide, >300€ stark
- EK-Quote: <15% riskant, 15-25% normal, 25-40% konservativ, >40% sehr konservativ

## KPI-FORMELN:
- Bruttomietrendite = (Jahreskaltmiete / Kaufpreis) × 100
- Nettomietrendite = ((Jahreskaltmiete − Bewirtschaftungskosten) / Anschaffungskosten) × 100
- Eigenkapitalrendite = (Jahres-Cashflow / Eigenkapital) × 100
- DSCR = Netto-Mieteinnahmen / Schuldendienst
- Cashflow = Mieteinnahmen − Bewirtschaftungskosten − Kreditrate

## STIL:
- Antworte IMMER auf Deutsch
- Duze den Nutzer
- Kompakt: max. 2-3 kurze Absätze, keine langen Aufsätze
- Direkt und ehrlich, keine Schönfärberei
- Bei Fachbegriffen: kurz erklären
- Keine Emojis (außer Nutzer verwendet welche)
- Du bist kein Finanzberater im rechtlichen Sinne — bei steuerlichen/rechtlichen Fragen auf professionelle Beratung verweisen`;
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
      maxOutputTokens: 600,
      temperature: 0.7,
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
