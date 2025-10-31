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
1) Klare Aussage (1-2 Sätze): Rentiert sich das? Begründe mit Cashflow vor Steuern (in Euro!) und Nettomietrendite.
   - Cashflow < -100€: Sag klar, dass es sich nicht rechnet
   - Cashflow -100€ bis -10€: "Praktisch ausgeglichen, leicht negativ"
   - Cashflow -10€ bis +10€: "Praktisch ausgeglichen"
   - Cashflow > +100€: Positiv bewerten
   Bewerte Rendite: <2% niedrig, 2-3% moderat, 3-4% solide, ≥4% attraktiv

2) Risikofaktor (1-2 Sätze): DSCR (wenn vorhanden) - erkläre Risiko (< 1 = kritisch, < 1.2 = knapp, ≥ 1.4 = gut). ODER EK-Quote - WICHTIG: Hohe EK-Quote = WENIGER Risiko/Belastung! (≥35% = sehr gut, 15-35% = solide, <15% = höhere Belastung)

3) Nächster Schritt (1-2 Sätze): Bei schlechten Zahlen (Cashflow < -100€ oder DSCR < 1): Sei ehrlich, dass es sich nicht rechnet, erwähne aber dass Lage das Bild vervollständigen könnte. Bei guten Zahlen: Motiviere zu "Markt & Lage" - dort sieht er ob Miete/Kaufpreis vs Median stimmen.

Sei ehrlich. Bei schlechten Zahlen: nicht zu pushy. Nutze NUR die gelieferten Zahlen.
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
  if (cashflowVorSteuer < -100) {
    parts.push(`Das Investment kostet dich ${fmtEuro(Math.abs(cashflowVorSteuer))} im Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). So rechnet sich das nicht – du zahlst jeden Monat drauf.`);
  } else if (cashflowVorSteuer < -10) {
    parts.push(`Praktisch ausgeglichen, leicht negativ mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Das Investment trägt sich fast selbst.`);
  } else if (cashflowVorSteuer <= 10) {
    parts.push(`Praktisch ausgeglichen mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Das Investment läuft auf Null raus.`);
  } else if (cashflowVorSteuer < 100) {
    parts.push(`Leicht positiv mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}). Ein kleiner Überschuss.`);
  } else if (nettorendite >= 4) {
    parts.push(`Mit ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat und ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) sieht das attraktiv aus. Die Zahlen stimmen.`);
  } else if (nettorendite >= 3) {
    parts.push(`${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – solide Ausgangslage.`);
  } else {
    parts.push(`${fmtEuro(cashflowVorSteuer)} Cashflow/Monat bei ${fmtPct(nettorendite, 2)} Rendite (${renditeLabel}) – moderate Zahlen.`);
  }

  // Teil 2: Risikofaktor (1-2 Sätze)
  if (isFiniteNumber(dscr)) {
    if (dscr < 1) {
      parts.push(`Kritischer Punkt: Die Mieteinnahmen decken die Rate nicht (DSCR ${dscr.toFixed(2)}).`);
    } else if (dscr < 1.2) {
      parts.push(`Die Rate ist knapp gedeckt (DSCR ${dscr.toFixed(2)}) – bei Leerstand wird's eng.`);
    } else if (dscr < 1.4) {
      parts.push(`Die Rate ist solide gedeckt (DSCR ${dscr.toFixed(2)}).`);
    } else {
      parts.push(`Die Rate ist komfortabel gedeckt (DSCR ${dscr.toFixed(2)}), guter Puffer.`);
    }
  } else if (isFiniteNumber(ekQuote)) {
    if (ekQuote >= 35) {
      parts.push(`Mit ${ekQuote.toFixed(0)} % Eigenkapital ist deine Belastung niedrig – das reduziert das Risiko deutlich.`);
    } else if (ekQuote >= 15) {
      parts.push(`Die EK-Quote von ${ekQuote.toFixed(0)} % ist solide.`);
    } else {
      parts.push(`Mit nur ${ekQuote.toFixed(0)} % Eigenkapital ist die Belastung höher – das erhöht dein Risiko.`);
    }
  }

  // Teil 3: Nächster Schritt (ehrlich, nicht zu pushy bei schlechten Zahlen)
  if (cashflowVorSteuer < -100 || (isFiniteNumber(dscr) && dscr < 1)) {
    parts.push(`Die Zahlen zeigen: So rechnet sich das nicht. Die Lage könnte das Bild vervollständigen – check „Markt & Lage" für den vollständigen Kontext.`);
  } else if (cashflowVorSteuer < 100) {
    parts.push(`Die Zahlen sind grenzwertig. In „Markt & Lage" siehst du, ob die Location das rechtfertigt – Miete vs. Median, Entwicklungstrend etc.`);
  } else {
    parts.push(`Die KPIs sehen gut aus. Entscheidend ist jetzt: Rechtfertigt die Lage diese Zahlen? Check „Markt & Lage" – dort siehst du Miete vs. Median und ob du am richtigen Ort kaufst.`);
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

    // Minimales Payload an das Modell
    const userPayload = {
      cashflowVorSteuer: cf,
      nettorendite: ry,
      dscr: isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined,
      ekQuotePct: isFiniteNumber(ekQuotePct) ? ekQuotePct : undefined,
      renditeLabel: classifyRenditeLabel(ry), // hilft dem Modell bei der Einordnung
    };

    console.log('[generateComment] Payload to OpenAI:', JSON.stringify(userPayload, null, 2));

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
