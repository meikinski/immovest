// src/app/api/generateComment/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CommentInput = {
  cashflowVorSteuer: number;
  nettorendite: number;
  dscr?: number;
  ek?: number;
  anschaffungskosten?: number;
  ekQuotePct?: number;
};

const SYSTEM_PROMPT = `
Du bist ein erfahrener Immobilieninvestor. Schreibe 3-4 kurze Sätze (~60-100 Wörter), die klar beantworten: Rentiert sich das?

Struktur:
1) Klare Aussage: Rentiert sich das? Begründe mit Cashflow vor Steuern und Nettomietrendite. Bei negativem Cashflow: Sag klar, dass das Investment aktuell Geld kostet. Bei positivem: Bewerte die Rendite (<2% niedrig, 2-3% moderat, 3-4% solide, ≥4% attraktiv).
2) Hauptfaktor (1 Satz): DSCR (wenn vorhanden) - deckt die Miete die Rate? ODER EK-Quote - wie wirkt sich das aus?
3) Wichtiger Hinweis (1 Satz): Die Lage und Marktentwicklung sind entscheidend. Verweis auf "Markt & Lage" Tab.

Sei ehrlich und direkt. Keine Floskeln. Nutze NUR die gelieferten Zahlen.
`.trim();

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function fmtEuro(n: number, fd = 0): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: fd, maximumFractionDigits: fd }) + ' €';
}

function fmtPct(n: number, fd = 2): string {
  const core = n.toLocaleString('de-DE', { minimumFractionDigits: fd, maximumFractionDigits: fd });
  return `${core} %`;
}

function classifyRenditeLabel(nr: number): 'niedrig' | 'moderat' | 'solide' | 'überdurchschnittlich' {
  if (nr >= 4) return 'überdurchschnittlich';
  if (nr >= 3) return 'solide';
  if (nr >= 2) return 'moderat';
  return 'niedrig';
}

/** Regelbasierter Fallback-Text, wenn kein OpenAI-Key vorhanden ist oder der Call fehlschlägt. */
function ruleBasedComment(p: CommentInput): string {
  const { cashflowVorSteuer, nettorendite, dscr } = p;

  // EK-Quote ggf. ableiten
  const ekQuote =
    isFiniteNumber(p.ekQuotePct)
      ? p.ekQuotePct
      : (isFiniteNumber(p.ek) && isFiniteNumber(p.anschaffungskosten) && p.anschaffungskosten > 0
          ? (p.ek / p.anschaffungskosten) * 100
          : undefined);

  const renditeLabel = classifyRenditeLabel(nettorendite);
  const parts: string[] = [];

  // Satz 1: Rentiert sich das?
  if (cashflowVorSteuer < -1000) {
    parts.push(`Das Investment kostet dich aktuell ${fmtEuro(Math.abs(cashflowVorSteuer))} im Monat – bei ${fmtPct(nettorendite, 2)} Nettomietrendite (${renditeLabel}). So rechnet sich das nicht.`);
  } else if (cashflowVorSteuer < 0) {
    parts.push(`Aktuell leicht negativ mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat, Rendite ${fmtPct(nettorendite, 2)} (${renditeLabel}). Ob sich das trägt, ist fraglich.`);
  } else if (nettorendite >= 4) {
    parts.push(`Mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat und ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) sieht das attraktiv aus.`);
  } else if (nettorendite >= 3) {
    parts.push(`${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – solide Ausgangslage.`);
  } else if (nettorendite >= 2) {
    parts.push(`${fmtEuro(cashflowVorSteuer)} Cashflow/Monat, ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – moderat, stark einzelfallabhängig.`);
  } else {
    parts.push(`Bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) und ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat würde ich kritisch prüfen.`);
  }

  // Satz 2: Hauptfaktor (DSCR oder EK)
  if (isFiniteNumber(dscr)) {
    if (dscr < 1) {
      parts.push(`Die Miete deckt die Rate nicht (DSCR ${dscr.toFixed(2)}).`);
    } else if (dscr < 1.2) {
      parts.push(`Die Rate ist knapp gedeckt (DSCR ${dscr.toFixed(2)}).`);
    } else {
      parts.push(`Die Rate ist ${dscr >= 1.4 ? 'komfortabel' : 'solide'} gedeckt (DSCR ${dscr.toFixed(2)}).`);
    }
  } else if (isFiniteNumber(ekQuote)) {
    if (ekQuote >= 35) {
      parts.push(`Hohe EK-Quote (${ekQuote.toFixed(0)} %) senkt das Risiko deutlich.`);
    } else if (ekQuote >= 15) {
      parts.push(`EK-Quote von ${ekQuote.toFixed(0)} % ist solide.`);
    } else {
      parts.push(`Niedrige EK-Quote (${ekQuote.toFixed(0)} %) bedeutet höhere Belastung.`);
    }
  }

  // Satz 3: Hinweis auf Markt & Lage
  parts.push(`Ob sich das langfristig trägt, hängt stark von Lage und Markt ab – check das in „Markt & Lage".`);

  return `<p>${parts.join(' ')}</p>`;
}

export async function POST(req: Request) {
  try {
    // --- Eingabe normalisieren (ohne any) ---
    type Norm = {
      [key: string]: unknown;
      cashflowVorSteuer?: number;
      nettorendite?: number;          // akzeptieren wir direkt …
      nettoMietrendite?: number;      // … oder diese Schreibweise (wird gemappt)
      dscr?: number;
      ek?: number;
      anschaffungskosten?: number;
      ekQuotePct?: number;
    };

    const rawRec: Record<string, unknown> = (await req.json()) as Record<string, unknown>;

    const toNum = (x: unknown): number | undefined => {
      if (typeof x === 'number' && Number.isFinite(x)) return x;
      if (typeof x === 'string') {
        const n = Number(x);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };

    const get = (k: keyof Norm): unknown => rawRec[k as string];

    const bodyNorm: Norm = {
      ...rawRec,
      cashflowVorSteuer: toNum(get('cashflowVorSteuer')),
      nettorendite: toNum(get('nettorendite')) ?? toNum(get('nettoMietrendite')),
      dscr: toNum(get('dscr')),
      ek: toNum(get('ek')),
      anschaffungskosten: toNum(get('anschaffungskosten')),
      ekQuotePct: toNum(get('ekQuotePct')),
    };

    const cf = bodyNorm.cashflowVorSteuer;
    const ry = bodyNorm.nettorendite;
    const hasCF = isFiniteNumber(cf);
    const hasRY = isFiniteNumber(ry);

    if (!hasCF || !hasRY) {
      return NextResponse.json({ comment: 'Zu wenige Daten für eine Kurzbewertung.' });
    }

    // EK-Quote ggf. herleiten (für Modell+Fallback)
    let ekQuotePct = bodyNorm.ekQuotePct;
    if (!isFiniteNumber(ekQuotePct)) {
      const ek = bodyNorm.ek;
      const ak = bodyNorm.anschaffungskosten;
      ekQuotePct = isFiniteNumber(ek) && isFiniteNumber(ak) && ak > 0 ? (ek / ak) * 100 : undefined;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Wenn kein API-Key → Fallback
    if (!apiKey) {
      return NextResponse.json({
        comment: ruleBasedComment({
          cashflowVorSteuer: cf,
          nettorendite: ry,
          dscr: isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined,
          ek: isFiniteNumber(bodyNorm.ek) ? bodyNorm.ek : undefined,
          anschaffungskosten: isFiniteNumber(bodyNorm.anschaffungskosten) ? bodyNorm.anschaffungskosten : undefined,
          ekQuotePct: isFiniteNumber(ekQuotePct) ? ekQuotePct : undefined,
        }),
      });
    }

    // Minimales Payload an das Modell
    const userPayload = {
      cashflowVorSteuer: cf,
      nettorendite: ry,
      dscr: isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined,
      ekQuotePct: isFiniteNumber(ekQuotePct) ? ekQuotePct : undefined,
      renditeLabel: classifyRenditeLabel(ry), // hilft dem Modell bei der Einordnung
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(userPayload) },
        ],
      }),
    });

    // Bei Fehlern: regelbasierter Fallback
    if (!r.ok) {
      return NextResponse.json({
        comment: ruleBasedComment({
          cashflowVorSteuer: cf,
          nettorendite: ry,
          dscr: isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined,
          ek: isFiniteNumber(bodyNorm.ek) ? bodyNorm.ek : undefined,
          anschaffungskosten: isFiniteNumber(bodyNorm.anschaffungskosten) ? bodyNorm.anschaffungskosten : undefined,
          ekQuotePct: isFiniteNumber(ekQuotePct) ? ekQuotePct : undefined,
        }),
      });
    }

    type OpenAIResponse = { choices?: Array<{ message?: { content?: string } }> };
    const openaiJson = (await r.json()) as OpenAIResponse;
    const text = openaiJson?.choices?.[0]?.message?.content?.trim();

    const finalText =
      text && text.length > 0
        ? text
        : ruleBasedComment({
            cashflowVorSteuer: cf,
            nettorendite: ry,
            dscr: isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined,
            ek: isFiniteNumber(bodyNorm.ek) ? bodyNorm.ek : undefined,
            anschaffungskosten: isFiniteNumber(bodyNorm.anschaffungskosten) ? bodyNorm.anschaffungskosten : undefined,
            ekQuotePct: isFiniteNumber(ekQuotePct) ? ekQuotePct : undefined,
          });

    return NextResponse.json({ comment: finalText });
  } catch {
    return NextResponse.json({ comment: 'Zu wenige Daten für eine Kurzbewertung.' });
  }
}
