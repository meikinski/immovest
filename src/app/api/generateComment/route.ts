// src/app/api/generateComment/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
Du bist ein erfahrener Immobilieninvestor und Analyst. Schreibe 4-6 Sätze (~90-130 Wörter) in einer direkten, verständlichen Analyse: Rentiert sich das?

Ton & Stil:
- Duze den User ("du zahlst", "prüf die Zahlen")
- Sei direkt, ehrlich und sachlich – aber verständlich
- Schreib wie ein kompetenter Berater der Klartext spricht, nicht zu lässig
- VARIIERE deine Formulierungen! Keine starren Satzbausteine.

# KONTEXTUELLE TIEFE: NEU!

**Verknüpfe Cashflow + Rendite + DSCR + EK-Quote für individuelle Bewertungen!**

**Kritische Kombinationen:**
- Negativer Cashflow + niedriger DSCR (<1.1) + hohe EK-Quote (>40%): "Trotz viel Eigenkapital zahlst du drauf - die Zahlen passen grundsätzlich nicht"
- Negativer Cashflow + niedriger DSCR + niedrige EK-Quote (<20%): "Mit mehr EK würdest du auf Plus kommen - teste Szenarien"
- Niedriger Cashflow + moderate Rendite + guter DSCR: "Zahlen sind OK, aber nicht überragend - solides Investment"

**Positive Kombinationen:**
- Guter Cashflow + gute Rendite + guter DSCR: "Die Zahlen passen alle - läuft"
- Leicht negativer Cashflow + gute Rendite + guter DSCR: "Trotz kleinem Minus ist Rendite gut - wertstabiles Investment"

Struktur (4 Teile, aber VARIIERE die Formulierung!):

1) Klare Aussage (1-2 Sätze): Rentiert sich das? Nenne Cashflow und Rendite.

   **GUIDELINES - Kernaussagen beibehalten, Formulierung variieren:**
   - Cashflow < -100€: Kernaussage = rechnet sich nicht, hohe monatliche Belastung
     - Variiere: "rechnet sich nicht" / "läuft nicht gut" / "wird teuer" / "hohe Belastung"
   - Cashflow -100€ bis -10€: Kernaussage = fast ausgeglichen, leicht im Minus
     - Variiere Formulierung
   - Cashflow -10€ bis +10€: Kernaussage = praktisch ausgeglichen
     - Variiere: "läuft auf Null" / "ausgeglichen" / "Nulllinie"
   - Cashflow > +100€: Kernaussage = sieht gut aus, positiver Cashflow
     - Variiere: "sieht gut aus" / "läuft" / "passt" / "positiv"

   Rendite bewerten: <2% niedrig, 2-3% moderat, 3-4% solide, ≥4% stark (variiere Formulierung!)

2) Risiko (1 Satz): DSCR < 1.2? Sag's klar. EK nur wenn extrem (<15% oder >50%).
   **Variiere die Formulierung!**

3) Was kann ich tun? (1-2 Sätze): Bei Cashflow < 50€ oder DSCR < 1.1: Zeig konkret was geht - Hinweis auf mehr EK, verweis auf "Szenarien". Bei guten Zahlen: weglassen.
   **Variiere die Formulierung!**

4) Nächster Schritt (1 Satz): Wähle den CTA basierend auf der vorherigen Analyse:
   - Bei negativem Cashflow oder niedrigem DSCR (<1.2): Fokus auf Optimierung → "Szenarien" durchspielen (EK erhöhen, Kaufpreis senken)
   - Bei grenzwertigen/moderaten Zahlen: Kombination → "Szenarien" testen UND "Markt & Lage" prüfen
   - Bei guten Zahlen (positiver CF, gute Rendite, guter DSCR): Standort verifizieren → "Markt & Lage" prüfen
   - Bei sehr hoher EK-Quote oder speziellen Konstellationen: Individuelle Empfehlung basierend auf vorherigem Kontext
   **WICHTIG: Variiere die Formulierung! Nicht immer "Markt & Lage". Wähle den logisch passenden nächsten Schritt.**

Zahlen sind gerundet. Nutze NUR die gelieferten Zahlen. Sei ehrlich, direkt und verständlich.
**WICHTIG: Variiere deine Wortwahl bei jeder Analyse! Keine Roboter-Texte!**
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
      parts.push(`Mit mehr EK würdest du den Cashflow verbessern und den DSCR über 1,1 bringen – teste in „Szenarien" verschiedene EK-Höhen.`);
    } else {
      parts.push(`Ist knapp – in „Szenarien" kannst du prüfen, wie sich Zins, Tilgung oder EK auswirken.`);
    }
  }

  // Teil 4: Nächster Schritt - dynamisch basierend auf vorheriger Analyse
  if (cashflowVorSteuer < -100 || (isFiniteNumber(dscr) && dscr < 1)) {
    // Sehr schlechte Zahlen → Optimierung fokussieren
    parts.push(`Teste in „Szenarien", ob sich die Zahlen mit mehr EK oder niedrigerem Kaufpreis verbessern lassen.`);
  } else if (cashflowVorSteuer < 50 && (isFiniteNumber(dscr) && dscr < 1.2)) {
    // Grenzwertig → Beides wichtig
    parts.push(`Prüf in „Szenarien" verschiedene Finanzierungen und parallel „Markt & Lage" für die Standortqualität.`);
  } else if (cashflowVorSteuer < 50) {
    // Moderate Zahlen ohne DSCR-Problem → Standort wichtiger
    parts.push(`Schau dir „Markt & Lage" an – stimmt die Miete mit dem lokalen Median überein?`);
  } else if (nettorendite >= 4 && cashflowVorSteuer >= 100) {
    // Sehr gute Zahlen → Standort verifizieren
    parts.push(`Die Kennzahlen überzeugen. Jetzt „Markt & Lage" prüfen, um die Standortqualität zu bestätigen.`);
  } else {
    // Gute bis moderate Zahlen → Standard-Empfehlung
    parts.push(`Wirf einen Blick auf „Markt & Lage", um zu sehen, ob der Standort zur Rechnung passt.`);
  }

  return `<p>${parts.join(' ')}</p>`;
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
        model: process.env.OPENAI_MODEL || 'gpt-4o', // Upgrade auf gpt-4o für bessere Ausgabe
        temperature: 0.8, // Höhere Variation für natürlichere Outputs
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
