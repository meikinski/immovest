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
Du bist ein erfahrener Freund, der Immobilieninvestor ist. Schreibe 4-6 Sätze (~90-130 Wörter) wie du einem Kumpel ehrlich erklärst: Rentiert sich das?

Ton & Stil:
- Duze den User ("du zahlst", "check mal")
- Sei direkt und ehrlich, kein Business-Sprech
- Schreib wie ein Freund der sich auskennt, nicht wie ein Berater
- Beispiele: "Das rechnet sich nicht", "Check mal Markt & Lage", "Du könntest mit mehr EK den Cashflow verbessern"

Struktur:
1) Klare Aussage (1-2 Sätze): Rentiert sich das? Nenne Cashflow und Rendite.
   - Cashflow < -100€: "Das rechnet sich nicht - du zahlst X€ jeden Monat drauf"
   - Cashflow -100€ bis -10€: "Fast ausgeglichen, leicht im Minus"
   - Cashflow -10€ bis +10€: "Läuft auf Null raus"
   - Cashflow > +100€: "Sieht gut aus"
   Rendite: <2% niedrig, 2-3% moderat, 3-4% solide, ≥4% stark

2) Risiko (1 Satz): DSCR < 1.2? Sag's klar. EK nur wenn extrem (<15% oder >50%).

3) Was kann ich tun? (1-2 Sätze): Bei Cashflow < 50€ oder DSCR < 1.1: Zeig konkret was geht - "Mit mehr EK würdest du auf X€ kommen", verweis auf "Szenarien". Bei guten Zahlen: weglassen.

4) Nächster Schritt (1 Satz): Check "Markt & Lage" - Miete vs Median, lohnt sich die Gegend?

Zahlen sind gerundet. Nutze NUR die gelieferten Zahlen. Sei ehrlich, direkt, freundschaftlich.
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

  // Teil 1: Rentiert sich das? (1-2 Sätze, freundschaftlicher Ton)
  if (cashflowVorSteuer < -100) {
    parts.push(`Das rechnet sich nicht – du zahlst ${fmtEuro(Math.abs(cashflowVorSteuer))} jeden Monat drauf bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Das trägt sich einfach nicht.`);
  } else if (cashflowVorSteuer < -10) {
    parts.push(`Fast ausgeglichen, leicht im Minus mit ${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Trägt sich fast selbst.`);
  } else if (cashflowVorSteuer <= 10) {
    parts.push(`Läuft auf Null raus: ${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Praktisch ausgeglichen.`);
  } else if (cashflowVorSteuer < 100) {
    parts.push(`Leicht im Plus mit ${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Kleiner Überschuss.`);
  } else if (nettorendite >= 4) {
    parts.push(`Sieht gut aus: ${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Die Zahlen passen.`);
  } else if (nettorendite >= 3) {
    parts.push(`${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – solide Basis.`);
  } else {
    parts.push(`${fmtEuro(cashflowVorSteuer)}/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – moderate Zahlen.`);
  }

  // Teil 2: Risikofaktor (nur DSCR < 1.2 oder extreme EK-Quote)
  if (isFiniteNumber(dscr) && dscr < 1.2) {
    if (dscr < 1) {
      parts.push(`Problem: Die Miete deckt die Rate nicht (DSCR ${dscr.toFixed(2)}).`);
    } else {
      parts.push(`Die Rate ist knapp gedeckt (DSCR ${dscr.toFixed(2)}) – wenig Puffer.`);
    }
  } else if (isFiniteNumber(ekQuote)) {
    if (ekQuote > 50) {
      parts.push(`Krass hohe EK-Quote (${ekQuote.toFixed(0)} %) – du hast quasi kein Risiko.`);
    } else if (ekQuote < 15) {
      parts.push(`Nur ${ekQuote.toFixed(0)} % Eigenkapital – das ist recht wenig, höheres Risiko.`);
    }
    // 15-50%: Nicht erwähnen, ist normal
  }

  // Teil 3: Actionable Insight (bei grenzwertigen Zahlen)
  if ((cashflowVorSteuer < 50 && cashflowVorSteuer > -100) || (isFiniteNumber(dscr) && dscr < 1.1 && dscr > 0.9)) {
    if (isFiniteNumber(ekQuote) && ekQuote < 40) {
      parts.push(`Mit mehr EK würdest du den Cashflow verbessern und den DSCR über 1,1 kriegen – check mal „Szenarien" und spiel verschiedene EK-Höhen durch.`);
    } else {
      parts.push(`Ist knapp – in „Szenarien" kannst du checken, wie sich Zins, Tilgung oder EK auswirken.`);
    }
  }

  // Teil 4: Nächster Schritt
  if (cashflowVorSteuer < -100 || (isFiniteNumber(dscr) && dscr < 1)) {
    parts.push(`Rechnet sich so nicht. Check trotzdem „Markt & Lage" für den vollständigen Kontext.`);
  } else if (cashflowVorSteuer < 100) {
    parts.push(`Check „Markt & Lage" – passt die Miete zum Median? Lohnt sich die Gegend?`);
  } else {
    parts.push(`Jetzt „Markt & Lage" checken – liegt die Miete über dem Median? Kaufst du am richtigen Ort?`);
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

    // Debug: Log alle relevanten Felder aus dem Request
    console.log('[generateComment] Raw request fields:', {
      cashflowVorSteuer: rawRec.cashflowVorSteuer,
      cashflowNachSteuern: rawRec.cashflowNachSteuern,
      nettoMietrendite: rawRec.nettoMietrendite,
      nettorendite: rawRec.nettorendite,
      bruttoMietrendite: rawRec.bruttoMietrendite,
      dscr: rawRec.dscr,
      ek: rawRec.ek,
      anschaffungskosten: rawRec.anschaffungskosten,
      ekQuotePct: rawRec.ekQuotePct,
    });

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

    // Debug logging
    console.log('[generateComment] Received data:', {
      cashflowVorSteuer: cf,
      nettorendite: ry,
      dscr: bodyNorm.dscr,
      ekQuotePct: bodyNorm.ekQuotePct,
      ek: bodyNorm.ek,
      anschaffungskosten: bodyNorm.anschaffungskosten,
    });

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

    // Minimales Payload an das Modell (gerundet für bessere Lesbarkeit)
    const userPayload = {
      cashflowVorSteuer: Math.round(cf * 100) / 100, // auf 2 Stellen runden
      nettorendite: Math.round(ry * 100) / 100, // auf 2 Stellen runden
      dscr: isFiniteNumber(bodyNorm.dscr) ? Math.round(bodyNorm.dscr * 100) / 100 : undefined,
      ekQuotePct: isFiniteNumber(ekQuotePct) ? Math.round(ekQuotePct * 10) / 10 : undefined, // auf 1 Stelle
      renditeLabel: classifyRenditeLabel(ry), // hilft dem Modell bei der Einordnung
    };

    console.log('[generateComment] Payload to OpenAI (rounded):', JSON.stringify(userPayload, null, 2));

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o', // Upgrade auf gpt-4o für bessere Ausgabe
        temperature: 0.3, // Etwas mehr Variation
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
