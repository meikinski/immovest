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
Du bist ein erfahrener Immobilieninvestor. Schreibe 4-6 Sätze (~80-120 Wörter), die klar beantworten: Rentiert sich das?

Struktur:
1) Klare Aussage (1-2 Sätze): Rentiert sich das? Begründe mit Cashflow vor Steuern und Nettomietrendite. Bei negativem Cashflow: Sag klar, dass das Investment aktuell Geld kostet und warum das kritisch ist. Bei positivem: Bewerte die Rendite (<2% niedrig, 2-3% moderat, 3-4% solide, ≥4% attraktiv) und ordne ein, ob das realistisch tragfähig ist.

2) Risikofaktor (1-2 Sätze): DSCR (wenn vorhanden) - erkläre, was das für das Risiko bedeutet (keine Deckung = hohes Risiko, knappe Deckung = wenig Puffer). ODER EK-Quote - zeige den Effekt auf (viel EK = niedriges Risiko, wenig EK = höhere Belastung).

3) Der entscheidende nächste Schritt (2 Sätze): Mach klar, dass diese Zahlen nur die halbe Wahrheit sind. Die Lage entscheidet alles: Ist die Miete über/unter Median? Entwickelt sich die Gegend gut? Wird der Kaufpreis durch die Lage gerechtfertigt? Motiviere den User stark, "Markt & Lage" zu checken - dort sieht er, ob das Investment wirklich Sinn macht oder nicht.

Sei ehrlich und direkt. Erzeuge Neugier für den nächsten Tab. Nutze NUR die gelieferten Zahlen.
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

  // Teil 1: Rentiert sich das? (1-2 Sätze)
  if (cashflowVorSteuer < -1000) {
    parts.push(`Das Investment kostet dich aktuell ${fmtEuro(Math.abs(cashflowVorSteuer))} im Monat – bei einer Nettomietrendite von ${fmtPct(nettorendite, 2)} (${renditeLabel}). Das bedeutet: Du zahlst jeden Monat drauf, ohne dass die Immobilie sich selbst trägt.`);
  } else if (cashflowVorSteuer < 0) {
    parts.push(`Der Cashflow ist mit ${fmtEuro(cashflowVorSteuer)}/Monat negativ bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Das Investment trägt sich aktuell nicht selbst – du musst jeden Monat zuschießen.`);
  } else if (nettorendite >= 4) {
    parts.push(`Mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat und ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) sieht das auf den ersten Blick attraktiv aus. Die Zahlen stimmen rechnerisch.`);
  } else if (nettorendite >= 3) {
    parts.push(`${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – eine solide Ausgangslage. Die KPIs zeigen ein grundsätzlich funktionierendes Investment.`);
  } else if (nettorendite >= 2) {
    parts.push(`Mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat und ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) sind die Zahlen moderat. Ob sich das wirklich rechnet, hängt stark vom Gesamtbild ab.`);
  } else {
    parts.push(`Bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) und ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat sind die KPIs kritisch. Hier würde ich sehr genau hinschauen.`);
  }

  // Teil 2: Risikofaktor (1-2 Sätze)
  if (isFiniteNumber(dscr)) {
    if (dscr < 1) {
      parts.push(`Kritischer Punkt: Die Mieteinnahmen decken die Rate nicht (DSCR ${dscr.toFixed(2)}) – ein klares Warnsignal.`);
    } else if (dscr < 1.2) {
      parts.push(`Die Rate ist knapp gedeckt (DSCR ${dscr.toFixed(2)}) – bei Leerstand oder Reparaturen wird's eng.`);
    } else if (dscr < 1.4) {
      parts.push(`Die Rate ist solide gedeckt (DSCR ${dscr.toFixed(2)}), aber viel Puffer bleibt nicht.`);
    } else {
      parts.push(`Gute Nachricht: Die Rate ist komfortabel gedeckt (DSCR ${dscr.toFixed(2)}), das gibt Spielraum für Unvorhergesehenes.`);
    }
  } else if (isFiniteNumber(ekQuote)) {
    if (ekQuote >= 35) {
      parts.push(`Mit ${ekQuote.toFixed(0)} % Eigenkapital hast du das Risiko deutlich reduziert – die Finanzierung steht auf solidem Fundament.`);
    } else if (ekQuote >= 15) {
      parts.push(`Die EK-Quote von ${ekQuote.toFixed(0)} % ist solide, mehr würde die Belastung aber weiter senken.`);
    } else {
      parts.push(`Achtung: Mit nur ${ekQuote.toFixed(0)} % Eigenkapital ist die Belastung hoch – das erhöht dein Risiko.`);
    }
  }

  // Teil 3: Der entscheidende nächste Schritt (2 Sätze mit starkem Hook)
  if (cashflowVorSteuer < 0 || nettorendite < 3) {
    parts.push(`Aber: Diese Zahlen sind nur die halbe Wahrheit. Ob sich das wirklich rechnet, entscheidet die Lage – ist die Miete unter Median (Potenzial nach oben)? Zahlt der Kaufpreis zu hoch? Check jetzt „Markt & Lage" und sieh, ob die Location das Investment rettet oder endgültig kippt.`);
  } else {
    parts.push(`Aber: Die KPIs sind nur ein Teil des Puzzles. Die entscheidende Frage ist: Rechtfertigt die Lage diese Zahlen? Liegt die Miete über dem lokalen Median? Entwickelt sich die Gegend positiv? In „Markt & Lage" siehst du, ob dieses Investment wirklich Sinn macht oder du an der falschen Stelle kaufst.`);
  }

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
