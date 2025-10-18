import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type Payload = {
  address: string;
  kaufpreis: number;
  flaeche: number;
  zimmer: number;
  baujahr?: number;
  miete: number;                 // mtl. Kaltmiete
  ek: number;
  zins: number;
  tilgung: number;
  cashflowVorSteuer: number;
  cashflowNachSteuern?: number;
  nettoMietrendite: number;
  bruttoMietrendite: number;
  ekRendite: number;
  anschaffungskosten?: number;
  darlehensSumme?: number;

  // optional vom Client
  ekQuotePct?: number;
  debtServiceMonthly?: number;   // Rate mtl.
  noiMonthly?: number;
  dscr?: number;

  // Markt/Lage & Szenario
  lageText?: string;
  mietvergleich?: string;
  preisvergleich?: string;
  szenario?: {
    kaufpreis?: number; miete?: number; zins?: number; tilgung?: number; ek?: number;
    cashflowVorSteuer?: number; nettoRendite?: number; ekRendite?: number;

    bruttorendite?: number;
    noiMonthly?: number;
    dscr?: number;
    rateMonat?: number;
    abzahlungsjahr?: number | null;
    cashflowNachSteuern?: number;
  } | null;
};

// Wertdarstellung für twoCols: String ODER { main, delta }
type ValueCell =
  | string
  | { main: string; delta?: string; color?: ReturnType<typeof rgb> };

export async function POST(req: Request) {
  try {
    const d = (await req.json()) as Payload;

    // ===== helpers / derived =====
    const eur = (n: number, f = 0) =>
      `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: f, maximumFractionDigits: f }).format(n)} €`;
    const pct = (n: number, f = 1) =>
      `${new Intl.NumberFormat('de-DE', { minimumFractionDigits: f, maximumFractionDigits: f }).format(n)} %`;
    const num = (n: number, f = 2) =>
      new Intl.NumberFormat('de-DE', { minimumFractionDigits: f, maximumFractionDigits: f }).format(n);

    const pricePerSqm = d.flaeche > 0 ? d.kaufpreis / d.flaeche : 0;
    const rentPerSqm  = d.flaeche > 0 ? d.miete / d.flaeche : 0;
    const rentYear    = d.miete * 12;

    const ekQuotePct = ((): number => {
      if (d.anschaffungskosten && d.anschaffungskosten > 0) return (d.ek / d.anschaffungskosten) * 100;
      return typeof d.ekQuotePct === 'number' ? d.ekQuotePct : 0;
    })();

    const debtMonthly = ((): number => {
      if (typeof d.debtServiceMonthly === 'number') return d.debtServiceMonthly;
      if (d.darlehensSumme && (d.zins || d.tilgung)) return d.darlehensSumme * ((d.zins + d.tilgung) / 100) / 12;
      return 0;
    })();
    const debtYear = debtMonthly * 12;

    const payoffYears = (z: number, t: number) => (z + t) > 0 ? Math.round(1 / ((z + t) / 100)) : 0;
    const payoffYearBase = (() => {
      const yrs = payoffYears(d.zins, d.tilgung);
      return yrs ? new Date().getFullYear() + yrs : 0;
    })();

    // base bruttorendite alias (Legacy: "bruttomietrendite")
    type PayloadCompat = Payload & { bruttomietrendite?: number };
    const hasLegacyBrutto = (input: unknown): input is PayloadCompat =>
      typeof input === 'object' && input !== null && 'bruttomietrendite' in input;

    const altBrutto = hasLegacyBrutto(d) && typeof d.bruttomietrendite === 'number'
      ? d.bruttomietrendite
      : undefined;

    const bruttoBase = typeof d.bruttoMietrendite === 'number'
      ? d.bruttoMietrendite
      : typeof altBrutto === 'number'
      ? altBrutto
      : 0;

    // ===== pdf init =====
    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595.28, 841.89]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const MARGIN = 40;
    const WIDTH  = 595.28 - MARGIN * 2;

    // Brand (Navy / Slate / Peach)
    const PRIMARY = rgb(38/255, 65/255, 113/255);    // Navy #264171
    const BRAND2  = rgb(230/255, 174/255, 99/255);   // Peach #E6AE63
    const MUTED   = rgb(108/255, 127/255, 153/255);  // Slate #6C7F99
    const GREEN   = rgb(39/255, 158/255, 93/255);    // Success
    const RED     = rgb(217/255, 65/255, 65/255);    // Danger
    const NEUTRAL = rgb(48/255, 56/255, 69/255);     // dunkles Slate
    const SKYLINE = rgb(0.86, 0.89, 0.94);           // dezente Linie

    // ===== WinAnsi-Sanitize =====
    const stripEmoji = (s: string) =>
      (s ?? '').replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    const sanitizeAnsi = (s: string) =>
      stripEmoji(s)
        .replace(/≈/g, 'ca.')
        .replace(/\u2212/g, '-')            // Unicode minus → ASCII '-'
        .replace(/[\u2013\u2014]/g, '-')    // en/em dash → '-'
        .replace(/[\u00A0\u2007\u202F\u2009]/g, ' ') // NBSP/thin/figure → space
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");

    let y = 841.89;
    const drawText = (t: string, x: number, yy: number, size = 11, isBold = false, color = rgb(0,0,0)) =>
      page.drawText(sanitizeAnsi(t ?? ''), { x, y: yy, size, font: isBold ? bold : font, color });

    const hr = (gapTop = 18, gapBottom = 24, color = SKYLINE) => {
      y -= gapTop;
      page.drawRectangle({ x: MARGIN, y: y - 1, width: WIDTH, height: 0.6, color });
      y -= gapBottom;
    };

    const ensure = (need: number) => {
      if (y - need < 60) {
        footer();
        page = pdf.addPage([595.28, 841.89]);
        y = 841.89 - 40;
      }
    };

    const wrap = (text: string, maxWidth: number, size = 11) => {
      const words = (text || '').split(/\s+/);
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (font.widthOfTextAtSize(test, size) > maxWidth) {
          if (line) lines.push(line);
          line = w;
        } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };

    const section = (title: string, accent: 'primary'|'brand2' = 'primary') => {
      ensure(40);
      drawText(title, MARGIN, y, 13, true);
      y -= 20;
      page.drawRectangle({
        x: MARGIN, y: y + 5, width: 76, height: 3,
        color: accent === 'primary' ? PRIMARY : BRAND2
      });
      y -= 10;
    };

    const drawValueCell = (labelX: number, valueX: number, yy: number, val: ValueCell) => {
      if (typeof val === 'string') {
        drawText(val, valueX, yy, 11, true);
        return;
      }
      const main = val.main ?? '';
      const delta = val.delta ?? '';

      // main fett
      drawText(main, valueX, yy, 11, true, NEUTRAL);
      const mainWidth = font.widthOfTextAtSize(sanitizeAnsi(main), 11);
      // delta normal, leicht grau
      drawText(delta, valueX + mainWidth + 6, yy, 10.5, false, MUTED);
    };

    const twoCols = (left: Array<[string, ValueCell]>, right: Array<[string, ValueCell]>) => {
      const colW = WIDTH / 2 - 12;
      const xL = MARGIN;
      const xR = MARGIN + colW + 24;
      const lineH = 14;
      const rows = Math.max(left.length, right.length);
      for (let i = 0; i < rows; i++) {
        ensure(lineH);
        const l = left[i];
        const r = right[i];
        if (l) {
          drawText(l[0], xL, y, 10.5, false, MUTED);
          drawValueCell(xL, xL + 160, y, l[1]);
        }
        if (r) {
          drawText(r[0], xR, y, 10.5, false, MUTED);
          drawValueCell(xR, xR + 160, y, r[1]);
        }
        y -= lineH;
      }
    };

    const chip = (
      label: string, x: number, yy: number,
      color: ReturnType<typeof rgb>,
      fill = rgb(1, 1, 1)
    ) => {
      const padX = 6, padY = 3, size = 10;
      const w = font.widthOfTextAtSize(sanitizeAnsi(label), size) + padX * 2;
      const h = size + padY * 2 - 2;
      page.drawRectangle({
        x, y: yy - h + 2, width: w, height: h,
        color: fill,
        borderColor: color,
        borderWidth: 1
      });
      drawText(label, x + padX, yy - size + 2, size, true, color);
      return w;
    };

    const footer = () => {
      const t = `Erstellt am ${new Date().toLocaleDateString('de-DE')} – Unverbindliche Überschlagsrechnung`;
      page.drawText(t, { x: MARGIN, y: 20, size: 9, font, color: MUTED });
    };

    const valColor = (diff: number, betterIfHigher = true) =>
      diff > 0 ? (betterIfHigher ? GREEN : RED) :
      diff < 0 ? (betterIfHigher ? RED   : GREEN) : NEUTRAL;

    // ===== Header Seite 1 =====
    page.drawRectangle({ x: 0, y: 841.89 - 60, width: 595.28, height: 60, color: PRIMARY });
    drawText('Immo Analyse', MARGIN, 841.89 - 36, 16, true, rgb(1,1,1));
    drawText(d.address || '-', MARGIN, 841.89 - 54, 11, false, rgb(1,1,1));
    y = 841.89 - 92;

    // ===== Eckdaten =====
    section('Eckdaten');
    twoCols(
      [
        ['Fläche', d.flaeche ? `${num(d.flaeche, 0)} m²` : '–'],
        ['Zimmer', d.zimmer != null ? String(d.zimmer) : '–'],
        ['Baujahr', d.baujahr ? String(d.baujahr) : '–'],
        ['Kaufpreis', eur(Math.round(d.kaufpreis))],
        ['Gesamtinvestition', d.anschaffungskosten != null ? eur(Math.round(d.anschaffungskosten)) : '–'],
      ],
      [
        ['Kaltmiete (monatl.)', eur(Math.round(d.miete))],
        ['Kaltmiete (jährl.)', eur(Math.round(rentYear))],
        ['Kaufpreis/qm', d.flaeche > 0 ? eur(Math.round(pricePerSqm)) : '–'],
        ['Miete/qm (monatl.)', d.flaeche > 0 ? `${num(rentPerSqm, 2)} €` : '–'],
        ['—', ''],
      ]
    );
    hr();

    // ===== Finanzierung =====
    section('Finanzierung');
    twoCols(
      [
        ['Eigenkapital', eur(Math.round(d.ek))],
        ['EK-Quote', isFinite(ekQuotePct) ? pct(ekQuotePct, 1) : '–'],
        ['Darlehenssumme', d.darlehensSumme != null ? eur(Math.round(d.darlehensSumme)) : '–'],
      ],
      [
        ['Zins / Tilgung', `${d.zins.toFixed(2)} % / ${d.tilgung.toFixed(2)} %`],
        ['Belastung (monatl.)', debtMonthly ? eur(debtMonthly, 0) : '–'],
        ['Belastung (jährl.)', debtMonthly ? eur(debtYear, 0) : '–'],
      ]
    );
    hr();

    // ===== KPIs =====
    section('KPIs');
    twoCols(
      [
        ['Cashflow (vor St.)', eur(Math.round(d.cashflowVorSteuer))],
        ['Nettomietrendite', pct(d.nettoMietrendite)],
        ['EK-Rendite', pct(d.ekRendite)],
        ['NOI (monatl.)', typeof d.noiMonthly === 'number' ? eur(Math.round(d.noiMonthly)) : '–'],
      ],
      [
        ['Cashflow (nach St.)', d.cashflowNachSteuern != null ? eur(Math.round(d.cashflowNachSteuern)) : '–'],
        ['Bruttomietrendite', pct(bruttoBase)],
        ['DSCR', typeof d.dscr === 'number' ? num(d.dscr, 2) : '–'],
        ['Abzahlungsjahr (ca.)', payoffYearBase ? String(payoffYearBase) : '–'],
      ]
    );

    // ===== Markt & Lage =====
    if (d.lageText || d.mietvergleich || d.preisvergleich) {
      hr();
      section('Markt & Lage');
      const blocks = [d.lageText, d.mietvergleich, d.preisvergleich].filter(Boolean) as string[];
      for (const block of blocks) {
        const lines = wrap(block, WIDTH, 10.5);
        ensure(lines.length * 12 + 6);
        for (const line of lines) { drawText(line, MARGIN, y, 10.5); y -= 12; }
        y -= 6;
      }
    }

    // ===== Szenario → IMMER Seite 2 =====
    if (d.szenario) {
      // Page break + Header in Brand2
      footer();
      page = pdf.addPage([595.28, 841.89]);
      y = 841.89;

      page.drawRectangle({ x: 0, y: y - 60, width: 595.28, height: 60, color: BRAND2 });
      drawText('Immo Analyse – Szenario', MARGIN, y - 36, 16, true, rgb(1,1,1));
      drawText(d.address || '-', MARGIN, y - 54, 11, false, rgb(1,1,1));
      y = 841.89 - 92;

      // Section Titel mit Brand2-Akzent
      section('Szenario', 'brand2');

      const s = d.szenario;

      // Δ vs Basis
      const deltaPct = (curr?: number, base?: number) =>
        (typeof curr === 'number' && typeof base === 'number' && base !== 0)
          ? Math.round(((curr - base) / base) * 100)
          : 0;
      const deltaPp = (curr?: number, base?: number) =>
        (typeof curr === 'number' && typeof base === 'number')
          ? +(curr - base).toFixed(2)
          : 0;

      const dmiete = deltaPct(s.miete ?? d.miete, d.miete);
      const dpreis = deltaPct(s.kaufpreis ?? d.kaufpreis, d.kaufpreis);
      const dzins  = deltaPp(s.zins ?? d.zins, d.zins);
      const dtilg  = deltaPp(s.tilgung ?? d.tilgung, d.tilgung);
      const dek    = deltaPct(s.ek ?? d.ek, d.ek);

      const colFor = (field: 'miete'|'preis'|'zins'|'tilgung'|'ek', delta: number) => {
        if (field === 'preis' || field === 'zins') return valColor(delta, /* betterIfHigher */ false);
        if (field === 'miete' || field === 'ek')   return valColor(delta, /* betterIfHigher */ true);
        return NEUTRAL; // Tilgung neutral
      };

      // Chips (Peach-Border)
      ensure(48);
      drawText('Anpassungen', MARGIN, y, 11, true);
      y -= 20;
      {
        let posL = MARGIN;
        posL += chip(`Kaltmiete ${dmiete >= 0 ? '+' : ''}${dmiete}%`, posL, y, colFor('miete', dmiete)) + 8;
        posL += chip(`Kaufpreis ${dpreis >= 0 ? '+' : ''}${dpreis}%`, posL, y, colFor('preis', dpreis)) + 8;
        chip(`Zins ${dzins >= 0 ? '+' : ''}${dzins} pp`, posL, y, colFor('zins', dzins));
      }
      {
        let posR = MARGIN + WIDTH / 2 + 16;
        posR += chip(`Tilgung ${dtilg >= 0 ? '+' : ''}${dtilg} pp`, posR, y, colFor('tilgung', dtilg)) + 8;
        chip(`Eigenkapital ${dek >= 0 ? '+' : ''}${dek}%`, posR, y, colFor('ek', dek));
      }
      y -= 48;

      // Neue Werte 2×2 (immer anzeigen, ggf. Basis)
      const sMiete   = s.miete   ?? d.miete;
      const sPreis   = s.kaufpreis ?? d.kaufpreis;
      const sZins    = s.zins    ?? d.zins;
      const sTilgung = s.tilgung ?? d.tilgung;
      const sEk      = s.ek      ?? d.ek;

      twoCols(
        [
          ['Kaltmiete (neu)', eur(Math.round(sMiete))],
          ['Kaufpreis (neu)', eur(Math.round(sPreis))],
        ],
        [
          ['Zins / Tilgung (neu)', `${sZins.toFixed(2)} % / ${sTilgung.toFixed(2)} %`],
          ['Eigenkapital (neu)', eur(Math.round(sEk))],
        ]
      );

      // Szenario-KPIs Headline
      hr(12, 14, rgb(0.95, 0.9, 0.85)); // Peach-ish Linie
      drawText('Szenario-KPIs', MARGIN, y, 12, true);
      y -= 18;

      // Hilfsformatierer: { main, delta }
      const deltaCell = (main: string, deltaRaw: string): ValueCell => ({
        main,
        delta: ` (${deltaRaw})`,
      });

      const withDelta = (
        scVal: number | null | undefined,
        baseVal: number | null | undefined,
        fmt: (n: number) => string
      ): ValueCell => {
        const b = typeof baseVal === 'number' ? baseVal : undefined;
        const sVal = typeof scVal === 'number' ? scVal : b ?? 0;
        const diff = (typeof sVal === 'number' && typeof b === 'number') ? sVal - b : 0;
        const sign = diff > 0 ? '+' : diff < 0 ? '-' : '±';
        return deltaCell(fmt(sVal), `${sign}${fmt(Math.abs(diff))}`);
      };

      const scenCashBefore = s.cashflowVorSteuer ?? d.cashflowVorSteuer;
      const scenCashAfter  = (s.cashflowNachSteuern ?? (d.cashflowNachSteuern ?? null)) ?? null;
      const scenNetto      = s.nettoRendite ?? d.nettoMietrendite;
      const scenBrutto     = s.bruttorendite ?? bruttoBase;
      const scenEkR        = s.ekRendite ?? d.ekRendite;
      const scenNoi        = s.noiMonthly ?? (d.noiMonthly ?? null);
      const scenDscr       = s.dscr ?? (d.dscr ?? null);
      const scenPayoffYear = ((): number | null => {
        if (typeof s.abzahlungsjahr === 'number') return s.abzahlungsjahr;
        if (typeof s.zins === 'number' && typeof s.tilgung === 'number') {
          const yrs = payoffYears(s.zins, s.tilgung);
          return yrs ? new Date().getFullYear() + yrs : payoffYearBase || null;
        }
        return payoffYearBase || null;
      })();

      const leftRows: Array<[string, ValueCell]> = [
        ['Cashflow (vor St.)', withDelta(scenCashBefore, d.cashflowVorSteuer, n => eur(Math.round(n)))],
        ['Cashflow (nach St.)', withDelta(scenCashAfter, d.cashflowNachSteuern ?? null, n => eur(Math.round(n)))],
        ['Nettomietrendite', withDelta(scenNetto, d.nettoMietrendite, n => pct(n))],
        ['Bruttomietrendite', withDelta(scenBrutto, bruttoBase, n => pct(n))],
      ];

      const payoffCell: ValueCell = (() => {
        const base = payoffYearBase || null;
        const sc = scenPayoffYear;
        if (base && sc) {
          const diff = sc - base;                // <0 = früher (besser)
          const sign = diff > 0 ? '+' : diff < 0 ? '-' : '±';
          const absTxt = `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'Jahr' : 'Jahre'}`;
          return { main: String(sc), delta: ` (${sign}${absTxt})` };
        }
        const same = base || new Date().getFullYear();
        return { main: String(same), delta: ' (±0 Jahre)' };
      })();

      const rightRows: Array<[string, ValueCell]> = [
        ['EK-Rendite', withDelta(scenEkR, d.ekRendite, n => pct(n))],
        ['NOI (monatl.)', withDelta(scenNoi, d.noiMonthly ?? null, n => eur(Math.round(n)))],
        ['DSCR', withDelta(scenDscr, d.dscr ?? null, n => Number(n).toFixed(2))],
        ['Abzahlungsjahr (ca.)', payoffCell],
      ];

      twoCols(leftRows, rightRows);

      // Footer Seite 2
      footer();
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="immo_analyse.pdf"',
      },
    });
  } catch (e) {
    console.error('PDF error', e);
    return NextResponse.json({ error: 'PDF error' }, { status: 500 });
  }
}
