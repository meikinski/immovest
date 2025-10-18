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
Du schreibst wie ein erfahrener Immobilieninvestor – kurz, menschlich, ohne Floskeln.
Ziel: 3 kurze Absätze (<p>…</p>), zusammen ~80–140 Wörter.
Nutze NUR die gelieferten Zahlen. Keine Orte/Quellen.

Stil & Inhalt:
1) Einstiegssatz mit natürlicher Variation (kein immer gleicher Wortlaut). Nenne Cashflow vor Steuern (€/Monat) und Nettomietrendite (%) in EINEM Satz und ordne die Rendite grob ein: <2% niedrig, 2–3% moderat, 3–4% solide, ≥4% überdurchschnittlich.
2) Tragfähigkeit: Wenn DSCR vorhanden, erkläre ihn in Alltagssprache („DSCR X.XX bedeutet: Rate ist [nicht/knapp/solide/komfortabel] gedeckt“, optional Puffer ≈ (DSCR–1)*100%). Wenn EK-Quote vorhanden: erläutere konkret den Effekt (mehr EK → geringere Rate → stabilerer Cashflow; wenig EK → höhere Rate/Risiko).
3) Konkreter nächster Schritt mit Tabs: Verweise knapp auf „Markt & Lage“ (Miete/Kaufpreis je m² gegen Median spiegeln) und „Szenarien“ (Zins/Tilgung/EK durchspielen, Effekt auf Rate & Cashflow sehen).

Kein Marketing-Sprech, keine Aufzählungen, keine Platzhalter. Schreibe auf Deutsch.
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

  // Einstieg – geringfügig variieren je nach Vorzeichen des CF
  const start =
    cashflowVorSteuer >= 0
      ? `Kurz zur Einordnung: Der Cashflow vor Steuern liegt bei etwa ${fmtEuro(cashflowVorSteuer)} im Monat; die Nettomietrendite beträgt ${fmtPct(nettorendite, 2)} (${renditeLabel}).`
      : `Zur Einordnung: Aktuell liegt der Cashflow vor Steuern bei rund ${fmtEuro(cashflowVorSteuer)} pro Monat; die Nettomietrendite liegt bei ${fmtPct(nettorendite, 2)} (${renditeLabel}).`;

  // DSCR-Teil
  let dscrText = '';
  if (isFiniteNumber(dscr)) {
    const pufferPct = Math.round(Math.max(0, (dscr - 1) * 100));
    if (dscr < 1) dscrText = `Der DSCR von ${dscr.toFixed(2)} zeigt: Die Rate ist derzeit nicht gedeckt.`;
    else if (dscr < 1.2) dscrText = `DSCR ${dscr.toFixed(2)} – die Rate ist knapp gedeckt (≈ ${pufferPct}% Puffer).`;
    else if (dscr < 1.4) dscrText = `DSCR ${dscr.toFixed(2)} – solide gedeckt (≈ ${pufferPct}% Puffer).`;
    else dscrText = `DSCR ${dscr.toFixed(2)} – komfortabel gedeckt (≈ ${pufferPct}% Puffer).`;
  }

  // EK-Teil (konkreter Effekt)
  let ekText = '';
  if (isFiniteNumber(ekQuote)) {
    if (ekQuote >= 35) {
      ekText = `Die EK-Quote von ${ekQuote.toFixed(1)} % drückt die Darlehenssumme – dadurch fällt die Monatsrate geringer aus und der Cashflow reagiert weniger sensibel auf Schwankungen.`;
    } else if (ekQuote >= 15) {
      ekText = `Mit ${ekQuote.toFixed(1)} % EK bist du solide unterwegs; etwas mehr EK könnte die Rate weiter senken und den Puffer erhöhen.`;
    } else {
      ekText = `Bei ${ekQuote.toFixed(1)} % EK ist die Rate relativ hoch; mehr EK würde die Belastung senken und den Cashflow entspannen.`;
    }
  }

  const p1 = `<p>${start}</p>`;
  const p2 = `<p>${[dscrText, ekText].filter(Boolean).join(' ')}</p>`;
  const p3 = `<p>Nächster Schritt: In „Markt & Lage“ Miete und Kaufpreis je m² mit dem Median vor Ort spiegeln; in „Szenarien“ Zins/Tilgung/EK anpassen und die Auswirkungen auf Rate und Cashflow sehen.</p>`;

  return [p1, p2, p3].join('');
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
