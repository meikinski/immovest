// src/app/api/generateComment/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  DEFAULT_VERDICT,
  parseStrategyCheck,
  toneFromNumbers,
  type StrategyCheck,
  type StrategyTone,
} from '@/lib/strategyCheck';

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
Du bist ein erfahrener Immobilieninvestor und Analyst. Bewerte die gelieferten Kennzahlen kurz und klar: Rentiert sich das?

Ton & Stil:
- Duze den User ("du zahlst", "prüf die Zahlen")
- Direkt, ehrlich, sachlich – wie ein kompetenter Berater, der Klartext spricht, nicht zu lässig
- Variiere deine Formulierungen, keine starren Satzbausteine
- Markiere die wichtigsten Kennzahlen mit **doppelten Sternchen** (z. B. "**111 €** Cashflow"). Sonst kein Markdown, kein HTML.

Einordnung:
- Cashflow: < -100 € klar negativ, -100 bis -10 € leicht negativ, -10 bis +10 € ausgeglichen, bis +100 € leicht positiv, > +100 € deutlich positiv
- Nettorendite: <2 % niedrig, 2–3 % moderat, 3–4 % solide, ≥4 % stark
- DSCR: <1,0 kritisch (Miete deckt Rate nicht), 1,0–1,2 knapp, ≥1,2 komfortabel
- EK-Quote: nur erwähnen, wenn auffällig (<15 % oder >50 %)
- Verknüpfe die Kennzahlen (z. B. negativer Cashflow trotz hoher EK-Quote = Zahlen passen grundsätzlich nicht; negativer Cashflow bei niedriger EK-Quote = mit mehr EK ins Plus, "Szenarien" testen)

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in genau diesem Format:
{
  "verdict": "Kurzes Urteil, max. 4 Wörter (z. B. \"Solides Investment\", \"Knapp kalkuliert\", \"Rechnet sich nicht\")",
  "summary": "1–2 Sätze Kernaussage: Rentiert sich das? Nenne Cashflow und Nettorendite.",
  "staerken": ["1–3 kurze Punkte (je max. 15 Wörter), was für das Investment spricht"],
  "risiken": ["1–3 kurze Punkte (je max. 15 Wörter), worauf man achten muss – auch bei guten Zahlen mindestens 1 Punkt"],
  "naechsterSchritt": "1 Satz mit konkreter Empfehlung"
}

Nächster Schritt – wähle logisch passend:
- Negativer Cashflow oder DSCR < 1,2: Optimierung → in "Szenarien" EK, Zins oder Kaufpreis durchspielen
- Grenzwertige Zahlen: "Szenarien" testen UND "Markt & Lage" prüfen
- Gute Zahlen: Standort verifizieren → "Markt & Lage" prüfen

Zahlen sind gerundet. Nutze NUR die gelieferten Zahlen, erfinde keine weiteren (keine Lage-, Markt- oder Objektdetails).
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

/** Regelbasierter Fallback, wenn kein OpenAI-Key vorhanden ist oder der Call fehlschlägt. */
function ruleBasedComment(p: CommentInput): string {
  const { cashflowVorSteuer: cf, nettorendite, dscr } = p;
  const hasDscr = isFiniteNumber(dscr);

  // EK-Quote ggf. ableiten
  const ekQuote =
    isFiniteNumber(p.ekQuotePct)
      ? p.ekQuotePct
      : (isFiniteNumber(p.ek) && isFiniteNumber(p.anschaffungskosten) && p.anschaffungskosten > 0
          ? (p.ek / p.anschaffungskosten) * 100
          : undefined);

  const tone = toneFromNumbers(cf, dscr);
  const renditeLabel = classifyRenditeLabel(nettorendite);
  const cfTxt = `**${fmtEuro(cf)}**`;
  const ryTxt = `**${fmtPct(nettorendite, 2)}**`;

  // Kernaussage
  let summary: string;
  if (cf < -100) {
    summary = `Das rechnet sich nicht: Du zahlst jeden Monat ${cfTxt} drauf, bei ${ryTxt} Nettorendite (${renditeLabel}).`;
  } else if (cf < -10) {
    summary = `Fast ausgeglichen, aber leicht im Minus: ${cfTxt} Cashflow im Monat bei ${ryTxt} Nettorendite (${renditeLabel}).`;
  } else if (cf <= 10) {
    summary = `Das Investment trägt sich praktisch selbst: ${cfTxt} Cashflow im Monat bei ${ryTxt} Nettorendite (${renditeLabel}).`;
  } else if (cf < 100) {
    summary = `Leicht im Plus mit ${cfTxt} Cashflow im Monat bei ${ryTxt} Nettorendite (${renditeLabel}).`;
  } else {
    summary = `Sieht gut aus: ${cfTxt} positiver Cashflow im Monat bei ${ryTxt} Nettorendite (${renditeLabel}).`;
  }

  const staerken: string[] = [];
  const risiken: string[] = [];

  if (cf > 10) staerken.push(`Positiver Cashflow von ${cfTxt} – die Immobilie trägt sich selbst.`);
  if (nettorendite >= 3) staerken.push(`Nettorendite von ${ryTxt} ist ${renditeLabel}.`);
  if (hasDscr && dscr >= 1.2) staerken.push(`DSCR von **${dscr.toFixed(2)}** – die Miete deckt die Rate mit Puffer.`);
  if (isFiniteNumber(ekQuote) && ekQuote > 50) staerken.push(`Hohe EK-Quote (**${ekQuote.toFixed(0)} %**) – geringes Finanzierungsrisiko.`);

  if (cf < -10) risiken.push(`Monatliche Zuzahlung von ${cfTxt.replace('-', '')} aus eigener Tasche.`);
  if (nettorendite < 2) risiken.push(`Nettorendite von ${ryTxt} ist niedrig.`);
  if (hasDscr && dscr < 1) risiken.push(`DSCR von **${dscr.toFixed(2)}** – die Miete deckt die Rate nicht.`);
  else if (hasDscr && dscr < 1.2) risiken.push(`DSCR von **${dscr.toFixed(2)}** – die Rate ist nur knapp gedeckt.`);
  if (isFiniteNumber(ekQuote) && ekQuote < 15) risiken.push(`Nur **${ekQuote.toFixed(0)} %** Eigenkapital – hoher Hebel, höheres Risiko.`);
  if (isFiniteNumber(ekQuote) && ekQuote > 50 && cf < -10) risiken.push('Trotz viel Eigenkapital im Minus – die Zahlen passen grundsätzlich nicht.');
  if (risiken.length === 0) risiken.push('Die Rechnung steht nur, wenn Miete und Nachfrage am Standort stabil bleiben.');
  if (staerken.length === 0 && cf >= -10) staerken.push('Das Investment trägt sich annähernd selbst.');

  let naechsterSchritt: string;
  if (cf < -100 || (hasDscr && dscr < 1)) {
    naechsterSchritt = 'Teste in „Szenarien“, ob sich die Zahlen mit mehr Eigenkapital oder niedrigerem Kaufpreis verbessern lassen.';
  } else if (cf < 50 && hasDscr && dscr < 1.2) {
    naechsterSchritt = 'Spiel in „Szenarien“ verschiedene Finanzierungen durch und prüf parallel „Markt & Lage“.';
  } else if (cf < 50) {
    naechsterSchritt = 'Schau dir „Markt & Lage“ an – passt die Miete zum lokalen Niveau?';
  } else {
    naechsterSchritt = 'Die Kennzahlen überzeugen – jetzt in „Markt & Lage“ die Standortqualität bestätigen.';
  }

  const result: StrategyCheck = {
    v: 2,
    tone,
    verdict: DEFAULT_VERDICT[tone],
    summary,
    staerken: staerken.slice(0, 3),
    risiken: risiken.slice(0, 3),
    naechsterSchritt,
  };
  return JSON.stringify(result);
}

/** Wandelt die Modellantwort (JSON) in einen validierten StrategyCheck-String um. */
function normalizeModelOutput(text: string, tone: StrategyTone): string | null {
  // Evtl. vorhandene Code-Fences entfernen
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
  const parsed = parseStrategyCheck(JSON.stringify({ ...obj, v: 2, tone }));
  return parsed ? JSON.stringify(parsed) : null;
}

export async function POST(req: Request) {
  try {
    // --- Auth-Check: Nur angemeldete User bekommen den vollen Kommentar ---
    let userId: string | null = null;

    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (error) {
      console.error('[generateComment] Auth check failed:', error);
      // Falls auth() fehlschlägt, behandeln wir User als nicht angemeldet
    }

    if (!userId) {
      // Nicht angemeldet -> locked Response
      return NextResponse.json({
        comment: '',
        locked: true
      });
    }

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
        model: process.env.OPENAI_MODEL || 'gpt-5.4',
        temperature: 0.8, // Höhere Variation für natürlichere Outputs
        response_format: { type: 'json_object' },
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

    const structured = text
      ? normalizeModelOutput(text, toneFromNumbers(cf, isFiniteNumber(bodyNorm.dscr) ? bodyNorm.dscr : undefined))
      : null;

    const finalText =
      structured ??
      ruleBasedComment({
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
