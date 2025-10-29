import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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
    pdf.registerFontkit(fontkit);

    // Load Unicode-compatible font from Google Fonts
    const fontUrlRegular = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A9-P.ttf';
    const fontUrlBold = 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc16L1SoM-jCpoiyD9A9-P.ttf';

    const [fontBytesRegular, fontBytesBold] = await Promise.all([
      fetch(fontUrlRegular).then(res => res.arrayBuffer()),
      fetch(fontUrlBold).then(res => res.arrayBuffer())
    ]);

    const font = await pdf.embedFont(fontBytesRegular);
    const bold = await pdf.embedFont(fontBytesBold);

    let page = pdf.addPage([595.28, 841.89]); // A4

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

    // ===== Unicode-Sanitize (minimal, da wir Noto Sans verwenden) =====
    const stripEmoji = (s: string) =>
      (s ?? '')
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')  // Emoji-Bereich entfernen
        .replace(/📍/g, '')                               // Spezifische Emojis
        .replace(/💰/g, '')
        .replace(/🏠/g, '');

    const sanitizeAnsi = (s: string) =>
      stripEmoji(s)
        .replace(/[\u00A0\u2007\u202F\u2009]/g, ' ')     // NBSP/thin/figure → space
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'");
        // Pfeile (↑↓→►) bleiben erhalten, da Noto Sans sie unterstützt!

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

    // ===== KPI Card =====
    const kpiCard = (
      label: string,
      value: string,
      subtext: string | null,
      x: number,
      yy: number,
      width: number,
      height: number,
      bgColor: ReturnType<typeof rgb>,
      valueColor: ReturnType<typeof rgb>
    ) => {
      // Background box mit leichtem Border
      page.drawRectangle({
        x, y: yy, width, height,
        color: rgb(1, 1, 1),
        borderColor: bgColor,
        borderWidth: 1.5
      });

      // Colored accent bar oben
      page.drawRectangle({
        x, y: yy + height - 4, width, height: 4,
        color: bgColor
      });

      // Label (klein, muted)
      drawText(label, x + 12, yy + height - 20, 9, false, MUTED);

      // Value (groß, bold, colored)
      drawText(value, x + 12, yy + height - 38, 14, true, valueColor);

      // Subtext (optional, klein)
      if (subtext) {
        drawText(subtext, x + 12, yy + height - 52, 9, false, MUTED);
      }
    };

    // ===== Delta Indicator mit Pfeil =====
    const deltaIndicator = (
      delta: number,
      formatter: (n: number) => string,
      betterIfHigher = true
    ): { text: string; color: ReturnType<typeof rgb>; arrow: string } => {
      const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
      const color = valColor(delta, betterIfHigher);
      const text = `${arrow} ${formatter(Math.abs(delta))}`;
      return { text, color, arrow };
    };

    // ===== Progress Bar =====
    const progressBar = (
      x: number,
      yy: number,
      width: number,
      percent: number,
      color: ReturnType<typeof rgb>
    ) => {
      // Background
      page.drawRectangle({
        x, y: yy, width, height: 8,
        color: rgb(0.95, 0.95, 0.95)
      });
      // Fill
      const fillWidth = Math.min(Math.max(percent, 0), 100) * width / 100;
      page.drawRectangle({
        x, y: yy, width: fillWidth, height: 8,
        color
      });
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
      ensure(50);
      drawText(title, MARGIN, y, 14, true, NEUTRAL);
      y -= 22;
      page.drawRectangle({
        x: MARGIN, y: y + 5, width: 90, height: 3,
        color: accent === 'primary' ? PRIMARY : BRAND2
      });
      y -= 16;
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
      // Linie oben
      page.drawRectangle({ x: MARGIN, y: 35, width: WIDTH, height: 0.6, color: SKYLINE });

      // Footer Text
      const t = `Erstellt am ${new Date().toLocaleDateString('de-DE')} mit Immovest`;
      page.drawText(t, { x: MARGIN, y: 22, size: 9, font, color: MUTED });

      // Disclaimer rechts
      const disclaimer = 'Unverbindliche Überschlagsrechnung';
      const disclaimerWidth = font.widthOfTextAtSize(disclaimer, 9);
      page.drawText(disclaimer, { x: 595.28 - MARGIN - disclaimerWidth, y: 22, size: 9, font, color: MUTED });
    };

    const valColor = (diff: number, betterIfHigher = true) =>
      diff > 0 ? (betterIfHigher ? GREEN : RED) :
      diff < 0 ? (betterIfHigher ? RED   : GREEN) : NEUTRAL;

    // ===== Header Seite 1 - Verbessertes Design =====
    page.drawRectangle({ x: 0, y: 841.89 - 80, width: 595.28, height: 80, color: PRIMARY });
    drawText('IMMOBILIEN ANALYSE', MARGIN, 841.89 - 32, 20, true, rgb(1,1,1));
    drawText(d.address || 'Keine Adresse angegeben', MARGIN, 841.89 - 54, 12, false, rgb(0.9, 0.9, 0.9));

    // Datum rechts im Header
    const dateText = `Erstellt: ${new Date().toLocaleDateString('de-DE')}`;
    const dateWidth = font.widthOfTextAtSize(dateText, 10);
    drawText(dateText, 595.28 - MARGIN - dateWidth, 841.89 - 32, 10, false, rgb(0.9, 0.9, 0.9));

    y = 841.89 - 100;

    // ===== Quick Summary KPI Cards =====
    ensure(100);
    drawText('Wichtigste Kennzahlen auf einen Blick', MARGIN, y, 14, true, PRIMARY);
    y -= 30;

    const cardWidth = (WIDTH - 24) / 3; // 3 Cards nebeneinander mit Gaps
    const cardHeight = 70;

    // Cashflow Card
    const cfColor = d.cashflowVorSteuer >= 0 ? GREEN : RED;
    kpiCard(
      'Cashflow (vor Steuern)',
      eur(Math.round(d.cashflowVorSteuer)),
      d.cashflowVorSteuer >= 0 ? 'Positiver Cashflow' : 'Negativer Cashflow',
      MARGIN,
      y - cardHeight,
      cardWidth,
      cardHeight,
      cfColor,
      cfColor
    );

    // Nettomietrendite Card
    const nettoColor = d.nettoMietrendite >= 3 ? GREEN : d.nettoMietrendite >= 1.5 ? BRAND2 : RED;
    kpiCard(
      'Nettomietrendite',
      pct(d.nettoMietrendite),
      `Ziel: >= 3%`,
      MARGIN + cardWidth + 12,
      y - cardHeight,
      cardWidth,
      cardHeight,
      nettoColor,
      nettoColor
    );

    // EK-Rendite Card
    const ekColor = d.ekRendite >= 5 ? GREEN : d.ekRendite >= 2 ? BRAND2 : RED;
    kpiCard(
      'Eigenkapitalrendite',
      pct(d.ekRendite),
      `Ziel: >= 5%`,
      MARGIN + (cardWidth + 12) * 2,
      y - cardHeight,
      cardWidth,
      cardHeight,
      ekColor,
      ekColor
    );

    y -= cardHeight + 40;

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

    // ===== KPIs mit visueller Darstellung =====
    section('KPIs & Kennzahlen');

    // Renditen mit Progress Bars
    ensure(80);
    drawText('Renditen (%):', MARGIN, y, 11, true, NEUTRAL);
    y -= 18;

    // Nettomietrendite
    drawText('Nettomietrendite', MARGIN, y, 10, false, MUTED);
    drawText(pct(d.nettoMietrendite), MARGIN + 200, y, 11, true, NEUTRAL);
    y -= 14;
    progressBar(MARGIN, y, 200, Math.min(d.nettoMietrendite * 10, 100), GREEN);
    y -= 22;

    // Bruttomietrendite
    drawText('Bruttomietrendite', MARGIN, y, 10, false, MUTED);
    drawText(pct(bruttoBase), MARGIN + 200, y, 11, true, NEUTRAL);
    y -= 14;
    progressBar(MARGIN, y, 200, Math.min(bruttoBase * 10, 100), PRIMARY);
    y -= 22;

    // EK-Rendite
    drawText('Eigenkapitalrendite', MARGIN, y, 10, false, MUTED);
    drawText(pct(d.ekRendite), MARGIN + 200, y, 11, true, NEUTRAL);
    y -= 14;
    progressBar(MARGIN, y, 200, Math.min(d.ekRendite * 10, 100), BRAND2);
    y -= 30;

    // Cashflow & weitere KPIs
    twoCols(
      [
        ['Cashflow (vor St.)', eur(Math.round(d.cashflowVorSteuer))],
        ['Cashflow (nach St.)', d.cashflowNachSteuern != null ? eur(Math.round(d.cashflowNachSteuern)) : '–'],
        ['NOI (monatl.)', typeof d.noiMonthly === 'number' ? eur(Math.round(d.noiMonthly)) : '–'],
      ],
      [
        ['DSCR', typeof d.dscr === 'number' ? num(d.dscr, 2) : '–'],
        ['Abzahlungsjahr (ca.)', payoffYearBase ? String(payoffYearBase) : '–'],
        ['—', ''],
      ]
    );

    // ===== Markt & Lage =====
    if (d.lageText || d.mietvergleich || d.preisvergleich) {
      hr();
      section('Markt & Lage');

      const textBlock = (title: string, content: string, icon: string) => {
        ensure(60);
        // Icon + Title
        drawText(icon, MARGIN, y, 12, false, PRIMARY);
        drawText(title, MARGIN + 18, y, 11, true, NEUTRAL);
        y -= 16;

        // Content Box
        const lines = wrap(content, WIDTH - 20, 10);
        const boxHeight = lines.length * 12 + 12;
        page.drawRectangle({
          x: MARGIN,
          y: y - boxHeight + 4,
          width: WIDTH,
          height: boxHeight,
          color: rgb(0.98, 0.98, 0.98),
          borderColor: SKYLINE,
          borderWidth: 0.8
        });

        for (const line of lines) {
          drawText(line, MARGIN + 10, y, 10, false, NEUTRAL);
          y -= 12;
        }
        y -= 16;
      };

      if (d.lageText) textBlock('Standortanalyse', d.lageText, '▶');
      if (d.mietvergleich) textBlock('Mietpreisvergleich', d.mietvergleich, '▶');
      if (d.preisvergleich) textBlock('Kaufpreisvergleich', d.preisvergleich, '▶');
    }

    // ===== Szenario → IMMER Seite 2 =====
    if (d.szenario) {
      // Page break + Header in Brand2
      footer();
      page = pdf.addPage([595.28, 841.89]);
      y = 841.89;

      page.drawRectangle({ x: 0, y: y - 80, width: 595.28, height: 80, color: BRAND2 });
      drawText('SZENARIO-ANALYSE', MARGIN, y - 32, 20, true, rgb(1,1,1));
      drawText(d.address || 'Keine Adresse angegeben', MARGIN, y - 54, 12, false, rgb(0.95, 0.95, 0.95));

      // "Vergleich zur Basis" rechts
      const compText = 'Vergleich zur Basis';
      const compWidth = font.widthOfTextAtSize(compText, 10);
      drawText(compText, 595.28 - MARGIN - compWidth, y - 32, 10, false, rgb(0.95, 0.95, 0.95));

      y = 841.89 - 100;

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

      // Anpassungen Box
      ensure(120);
      drawText('Anpassungen gegenüber Basis', MARGIN, y, 13, true, PRIMARY);
      y -= 24;

      // Hintergrund-Box für alle Anpassungen
      const adjustBoxHeight = 80;
      page.drawRectangle({
        x: MARGIN - 8,
        y: y - adjustBoxHeight + 8,
        width: WIDTH + 16,
        height: adjustBoxHeight,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: BRAND2,
        borderWidth: 1
      });

      // Row 1: Miete und Kaufpreis
      const rowGap = 28;
      drawText('Kaltmiete:', MARGIN + 4, y, 10, false, MUTED);
      const mieteDelta = deltaIndicator(dmiete, (n) => `${n}%`, true);
      drawText(`${dmiete >= 0 ? '+' : ''}${dmiete}%`, MARGIN + 100, y, 11, true, mieteDelta.color);
      drawText(mieteDelta.arrow, MARGIN + 80, y, 12, false, mieteDelta.color);

      drawText('Kaufpreis:', MARGIN + WIDTH / 2 + 4, y, 10, false, MUTED);
      const preisDelta = deltaIndicator(dpreis, (n) => `${n}%`, false);
      drawText(`${dpreis >= 0 ? '+' : ''}${dpreis}%`, MARGIN + WIDTH / 2 + 100, y, 11, true, preisDelta.color);
      drawText(preisDelta.arrow, MARGIN + WIDTH / 2 + 80, y, 12, false, preisDelta.color);
      y -= rowGap;

      // Row 2: Zins und Tilgung
      drawText('Zins:', MARGIN + 4, y, 10, false, MUTED);
      const zinsDelta = deltaIndicator(dzins, (n) => `${n.toFixed(2)} pp`, false);
      drawText(`${dzins >= 0 ? '+' : ''}${dzins.toFixed(2)} pp`, MARGIN + 100, y, 11, true, zinsDelta.color);
      drawText(zinsDelta.arrow, MARGIN + 80, y, 12, false, zinsDelta.color);

      drawText('Tilgung:', MARGIN + WIDTH / 2 + 4, y, 10, false, MUTED);
      const tilgDelta = deltaIndicator(dtilg, (n) => `${n.toFixed(2)} pp`, true);
      drawText(`${dtilg >= 0 ? '+' : ''}${dtilg.toFixed(2)} pp`, MARGIN + WIDTH / 2 + 100, y, 11, true, NEUTRAL);
      drawText(tilgDelta.arrow, MARGIN + WIDTH / 2 + 80, y, 12, false, NEUTRAL);
      y -= rowGap;

      // Row 3: Eigenkapital
      drawText('Eigenkapital:', MARGIN + 4, y, 10, false, MUTED);
      const ekDelta = deltaIndicator(dek, (n) => `${n}%`, true);
      drawText(`${dek >= 0 ? '+' : ''}${dek}%`, MARGIN + 100, y, 11, true, ekDelta.color);
      drawText(ekDelta.arrow, MARGIN + 80, y, 12, false, ekDelta.color);

      y -= adjustBoxHeight - rowGap * 3 + 10;

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
      drawText('Szenario-Ergebnisse', MARGIN, y, 13, true, PRIMARY);
      y -= 24;

      // Vergleichstabelle: Basis | Szenario | Delta
      const comparisonRow = (
        label: string,
        baseVal: number,
        scenVal: number,
        formatter: (n: number) => string,
        betterIfHigher = true
      ) => {
        ensure(24);
        const labelX = MARGIN;
        const baseX = MARGIN + 220;
        const scenX = MARGIN + 340;
        const deltaX = MARGIN + 460;

        drawText(label, labelX, y, 10, false, MUTED);
        drawText(formatter(baseVal), baseX, y, 10, false, NEUTRAL);
        drawText(formatter(scenVal), scenX, y, 11, true, NEUTRAL);

        const diff = scenVal - baseVal;
        const delta = deltaIndicator(diff, formatter, betterIfHigher);
        drawText(delta.text, deltaX, y, 10, true, delta.color);

        y -= 18;
      };

      const scenCashBefore = s.cashflowVorSteuer ?? d.cashflowVorSteuer;
      const scenCashAfter  = (s.cashflowNachSteuern ?? (d.cashflowNachSteuern ?? null)) ?? null;
      const scenNetto      = s.nettoRendite ?? d.nettoMietrendite;
      const scenBrutto     = s.bruttorendite ?? bruttoBase;
      const scenEkR        = s.ekRendite ?? d.ekRendite;
      const scenNoi        = s.noiMonthly ?? (d.noiMonthly ?? null);
      const scenDscr       = s.dscr ?? (d.dscr ?? null);

      // Table Header
      drawText('Kennzahl', MARGIN, y, 9, true, MUTED);
      drawText('Basis', MARGIN + 220, y, 9, true, MUTED);
      drawText('Szenario', MARGIN + 340, y, 9, true, MUTED);
      drawText('Veränderung', MARGIN + 460, y, 9, true, MUTED);
      y -= 16;

      // Linie unter Header
      page.drawRectangle({ x: MARGIN, y: y + 2, width: WIDTH, height: 0.8, color: SKYLINE });
      y -= 8;

      // Vergleichszeilen
      comparisonRow('Cashflow (vor St.)', d.cashflowVorSteuer, scenCashBefore, (n) => eur(Math.round(n)), true);

      if (d.cashflowNachSteuern != null && scenCashAfter != null) {
        comparisonRow('Cashflow (nach St.)', d.cashflowNachSteuern, scenCashAfter, (n) => eur(Math.round(n)), true);
      }

      comparisonRow('Nettomietrendite', d.nettoMietrendite, scenNetto, pct, true);
      comparisonRow('Bruttomietrendite', bruttoBase, scenBrutto, pct, true);
      comparisonRow('EK-Rendite', d.ekRendite, scenEkR, pct, true);

      if (d.noiMonthly != null && scenNoi != null) {
        comparisonRow('NOI (monatl.)', d.noiMonthly, scenNoi, (n) => eur(Math.round(n)), true);
      }

      if (d.dscr != null && scenDscr != null) {
        comparisonRow('DSCR', d.dscr, scenDscr, (n) => num(n, 2), true);
      }

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
