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
Ziel: 3 kurze Absätze (<p>…</p>), zusammen ~100–160 Wörter.
Nutze NUR die gelieferten Zahlen. Keine Orte/Quellen.

Stil & Inhalt:
1) Erste Einschätzung zur Rentabilität: Beginne mit einer klaren Bewertung basierend auf Cashflow vor Steuern (€/Monat) und Nettomietrendite (%). Ordne ein: <2% niedrig (kritisch prüfen), 2–3% moderat (kann funktionieren), 3–4% solide (interessant), ≥4% überdurchschnittlich (attraktiv). Gib eine ehrliche Einschätzung: Könnte sich das rechnen? Formuliere es natürlich variierend.
2) Tragfähigkeit & Risiko: Wenn DSCR vorhanden, erkläre ihn verständlich („DSCR X.XX bedeutet: Mieteinnahmen decken die Rate [nicht/knapp/solide/komfortabel]", optional Puffer ≈ (DSCR–1)*100%). Wenn EK-Quote vorhanden: zeige den konkreten Effekt auf (mehr EK → niedrigere Rate/Risiko; wenig EK → höhere Belastung).
3) Der entscheidende Faktor: Mach klar, dass die Zahlen nur ein Teil des Bildes sind. Die Lage und der lokale Markt entscheiden letztlich, ob sich das Investment langfristig trägt. Weise subtil darauf hin, dass ein Blick auf „Markt & Lage" (Miete/Kaufpreis vs. lokaler Median, Entwicklungstrend) wichtige Antworten liefert. Optional kurzer Hinweis auf „Szenarien" für Sensitivitätsanalyse.

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

  // Absatz 1: Erste Einschätzung zur Rentabilität
  let einschaetzung = '';
  if (nettorendite >= 4) {
    einschaetzung = cashflowVorSteuer >= 0
      ? `Die Zahlen sehen attraktiv aus: ${fmtEuro(cashflowVorSteuer)} Cashflow vor Steuern im Monat bei einer Nettomietrendite von ${fmtPct(nettorendite, 2)} (${renditeLabel}). Rein rechnerisch könnte sich das lohnen.`
      : `Mit ${fmtPct(nettorendite, 2)} Nettomietrendite (${renditeLabel}) ist die Rendite überdurchschnittlich, der Cashflow liegt aktuell bei ${fmtEuro(cashflowVorSteuer)}/Monat. Unter Umständen trotzdem interessant.`;
  } else if (nettorendite >= 3) {
    einschaetzung = cashflowVorSteuer >= 0
      ? `Solide Ausgangslage: ${fmtEuro(cashflowVorSteuer)} Cashflow vor Steuern monatlich, Nettomietrendite ${fmtPct(nettorendite, 2)} (${renditeLabel}). Das könnte funktionieren.`
      : `Die Nettomietrendite von ${fmtPct(nettorendite, 2)} (${renditeLabel}) ist solide, aktueller Cashflow: ${fmtEuro(cashflowVorSteuer)}/Monat. Hier lohnt sich ein genauerer Blick.`;
  } else if (nettorendite >= 2) {
    einschaetzung = cashflowVorSteuer >= 0
      ? `Moderate Rendite: ${fmtPct(nettorendite, 2)} (${renditeLabel}) bei ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat. Ob sich das rechnet, hängt stark vom Einzelfall ab.`
      : `Bei ${fmtPct(nettorendite, 2)} Nettomietrendite (${renditeLabel}) und ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat solltest du genau prüfen, ob das wirtschaftlich tragfähig ist.`;
  } else {
    einschaetzung = `Mit ${fmtPct(nettorendite, 2)} Nettomietrendite (${renditeLabel}) und ${fmtEuro(cashflowVorSteuer)} Cashflow/Monat sind die Zahlen kritisch. Hier würde ich besonders gründlich rechnen.`;
  }

  // Absatz 2: Tragfähigkeit & Risiko
  let tragfaehigkeit = '';

  // DSCR-Teil
  if (isFiniteNumber(dscr)) {
    const pufferPct = Math.round(Math.max(0, (dscr - 1) * 100));
    if (dscr < 1) tragfaehigkeit = `Der DSCR von ${dscr.toFixed(2)} zeigt: Die Mieteinnahmen decken die Rate aktuell nicht – ein Warnsignal.`;
    else if (dscr < 1.2) tragfaehigkeit = `DSCR ${dscr.toFixed(2)}: Die Rate ist knapp gedeckt (≈ ${pufferPct}% Puffer), wenig Spielraum bei Leerstand oder Reparaturen.`;
    else if (dscr < 1.4) tragfaehigkeit = `DSCR ${dscr.toFixed(2)}: Solide gedeckt mit ≈ ${pufferPct}% Puffer – das gibt etwas Sicherheit.`;
    else tragfaehigkeit = `DSCR ${dscr.toFixed(2)}: Komfortabel gedeckt (≈ ${pufferPct}% Puffer), gute Ausgangslage.`;
  }

  // EK-Teil (konkreter Effekt)
  if (isFiniteNumber(ekQuote)) {
    const ekTxt =
      ekQuote >= 35
        ? ` Mit ${ekQuote.toFixed(1)} % Eigenkapital drückst du die Darlehenssumme deutlich – das senkt die Rate und macht den Cashflow robuster.`
        : ekQuote >= 15
        ? ` Bei ${ekQuote.toFixed(1)} % EK bist du solide dabei; mehr Eigenkapital würde die Belastung weiter reduzieren.`
        : ` Die EK-Quote von ${ekQuote.toFixed(1)} % bedeutet eine höhere Rate – hier wäre mehr Eigenkapital hilfreich, um das Risiko zu senken.`;
    tragfaehigkeit += ekTxt;
  }

  // Absatz 3: Der entscheidende Faktor (subtiler Hinweis auf Markt & Lage)
  const naechsteSchritte =
    nettorendite >= 3
      ? `Die Zahlen allein sagen aber nur die halbe Wahrheit: Ob sich das wirklich trägt, hängt stark von Lage und lokalem Markt ab. Ein Blick auf „Markt & Lage" zeigt dir, wie Miete und Kaufpreis im Vergleich zum Median stehen – und ob die Gegend Potenzial hat oder eher stagniert.`
      : `Wichtig: Diese Kennzahlen sind nur ein Teil des Puzzles. Die Lage und Marktentwicklung vor Ort entscheiden letztlich, ob das Investment Sinn macht. In „Markt & Lage" kannst du checken, wie die Immobilie im Vergleich zum lokalen Median dasteht – das kann den Unterschied machen.`;

  const p1 = `<p>${einschaetzung}</p>`;
  const p2 = `<p>${tragfaehigkeit}</p>`;
  const p3 = `<p>${naechsteSchritte}</p>`;

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
