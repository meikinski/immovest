import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export async function POST(req: Request) {
  try {
    const d = (await req.json()) as Payload;

    // ===== Helpers =====
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

    // Legacy brutto alias
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

    // ===== PDF Init =====
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fontPathRegular = join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf');
    const fontPathBold = join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf');

    const fontBytesRegular = readFileSync(fontPathRegular);
    const fontBytesBold = readFileSync(fontPathBold);

    const font = await pdf.embedFont(fontBytesRegular);
    const bold = await pdf.embedFont(fontBytesBold);

    let page = pdf.addPage([595.28, 841.89]); // A4

    const MARGIN = 50;
    const WIDTH  = 595.28 - MARGIN * 2;

    // Professionelle Bank-Farben (sehr reduziert)
    const NAVY = rgb(25/255, 42/255, 86/255);        // Dunkles Marineblau
    const GRAY = rgb(100/255, 100/255, 100/255);     // Mittelgrau für Labels
    const LIGHT_GRAY = rgb(245/255, 245/255, 245/255); // Hintergrund
    const BORDER = rgb(220/255, 220/255, 220/255);   // Dezente Linie
    const GREEN = rgb(39/255, 158/255, 93/255);      // Erfolg
    const RED = rgb(217/255, 65/255, 65/255);        // Warnung
    const BLACK = rgb(0, 0, 0);

    // ===== Text Helper =====
    const sanitizeText = (s: string) =>
      (s ?? '')
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
        .replace(/[\u00A0\u2007\u202F\u2009]/g, ' ')
        .replace(/[""]/g, '"')
        .replace(/['']/g, "'");

    let y = 841.89;
    const drawText = (t: string, x: number, yy: number, size = 10, isBold = false, color = BLACK) =>
      page.drawText(sanitizeText(t ?? ''), { x, y: yy, size, font: isBold ? bold : font, color });

    const ensure = (need: number) => {
      if (y - need < 60) {
        addFooter();
        page = pdf.addPage([595.28, 841.89]);
        y = 841.89 - 60;
      }
    };

    const addFooter = () => {
      page.drawRectangle({ x: MARGIN, y: 30, width: WIDTH, height: 0.5, color: BORDER });
      const footerText = `Erstellt am ${new Date().toLocaleDateString('de-DE')} | Unverbindliche Überschlagsrechnung`;
      drawText(footerText, MARGIN, 18, 8, false, GRAY);
    };

    // ===== Bullet Helper =====
    const extractBullets = (text: string, maxBullets = 5): string[] => {
      // Versuche Bullet Points zu extrahieren oder aus Sätzen zu machen
      const lines = text.split(/[.!?]\s+/).filter(l => l.trim().length > 20);
      return lines.slice(0, maxBullets).map(l => l.trim());
    };

    // ===== SEITE 1: DECKBLATT =====
    y = 841.89 - 60;

    // Minimalistischer Header
    drawText('IMMOBILIEN-ANALYSE', MARGIN, y, 24, true, NAVY);
    y -= 35;
    drawText(d.address || 'Keine Adresse', MARGIN, y, 12, false, GRAY);
    y -= 10;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: 100, height: 1.5, color: NAVY });
    y -= 50;

    // ===== 3 GROSSE KPI CARDS =====
    const cardW = (WIDTH - 40) / 3;
    const cardH = 110;
    const cardY = y - cardH;

    // Card Helper
    const drawKpiCard = (
      label: string,
      value: string,
      subtext: string,
      x: number,
      accentColor: ReturnType<typeof rgb>
    ) => {
      // Box
      page.drawRectangle({
        x, y: cardY, width: cardW, height: cardH,
        color: rgb(1, 1, 1),
        borderColor: BORDER,
        borderWidth: 1
      });

      // Accent top border
      page.drawRectangle({
        x, y: cardY + cardH - 3, width: cardW, height: 3,
        color: accentColor
      });

      // Label
      drawText(label, x + 16, cardY + cardH - 28, 9, false, GRAY);

      // Value (sehr groß!)
      drawText(value, x + 16, cardY + cardH - 55, 20, true, NAVY);

      // Subtext
      drawText(subtext, x + 16, cardY + cardH - 75, 8, false, GRAY);
    };

    // CARD 1: Cashflow
    const cfColor = d.cashflowVorSteuer >= 0 ? GREEN : RED;
    const cfStatus = d.cashflowVorSteuer >= 0 ? 'Positiv' : 'Negativ';
    drawKpiCard(
      'CASHFLOW (MONATLICH)',
      eur(Math.round(d.cashflowVorSteuer)),
      cfStatus,
      MARGIN,
      cfColor
    );

    // CARD 2: DSCR (SEHR WICHTIG!)
    const dscrVal = d.dscr ?? 0;
    const dscrColor = dscrVal >= 1.25 ? GREEN : dscrVal >= 1.0 ? NAVY : RED;
    const dscrText = dscrVal >= 1.25 ? 'Sehr gut' : dscrVal >= 1.0 ? 'Ausreichend' : 'Kritisch';
    drawKpiCard(
      'DSCR (DEBT SERVICE COVERAGE)',
      num(dscrVal, 2),
      dscrText,
      MARGIN + cardW + 20,
      dscrColor
    );

    // CARD 3: EK-Quote
    const ekColor = ekQuotePct >= 25 ? GREEN : ekQuotePct >= 15 ? NAVY : RED;
    const ekText = ekQuotePct >= 25 ? 'Stark' : ekQuotePct >= 15 ? 'Solide' : 'Schwach';
    drawKpiCard(
      'EIGENKAPITALQUOTE',
      pct(ekQuotePct, 1),
      ekText,
      MARGIN + (cardW + 20) * 2,
      ekColor
    );

    y = cardY - 50;

    // ===== OBJEKTDATEN KOMPAKT =====
    drawText('OBJEKTDATEN', MARGIN, y, 11, true, NAVY);
    y -= 20;

    // Tabelle: 2 Spalten
    const objData: [string, string][] = [
      ['Kaufpreis', eur(Math.round(d.kaufpreis))],
      ['Fläche', d.flaeche ? `${num(d.flaeche, 0)} m²` : '–'],
      ['Zimmer', d.zimmer != null ? String(d.zimmer) : '–'],
      ['Baujahr', d.baujahr ? String(d.baujahr) : '–'],
      ['Kaltmiete (monatlich)', eur(Math.round(d.miete))],
      ['Kaufpreis/m²', d.flaeche > 0 ? eur(Math.round(pricePerSqm)) : '–'],
    ];

    const col1X = MARGIN;
    const col2X = MARGIN + WIDTH / 2;
    const rowH = 16;

    for (let i = 0; i < objData.length; i++) {
      const [label, value] = objData[i];
      const xPos = i % 2 === 0 ? col1X : col2X;
      const yPos = y - Math.floor(i / 2) * rowH;

      drawText(label, xPos, yPos, 9, false, GRAY);
      drawText(value, xPos + 140, yPos, 10, true, BLACK);
    }

    y -= Math.ceil(objData.length / 2) * rowH + 20;

    // ===== FINANZIERUNGSÜBERSICHT =====
    drawText('FINANZIERUNG', MARGIN, y, 11, true, NAVY);
    y -= 20;

    const finData: [string, string][] = [
      ['Eigenkapital', eur(Math.round(d.ek))],
      ['Darlehenssumme', d.darlehensSumme != null ? eur(Math.round(d.darlehensSumme)) : '–'],
      ['Zinssatz', `${d.zins.toFixed(2)} %`],
      ['Tilgung', `${d.tilgung.toFixed(2)} %`],
      ['Monatliche Rate', debtMonthly ? eur(debtMonthly, 0) : '–'],
      ['Gesamtinvestition', d.anschaffungskosten ? eur(Math.round(d.anschaffungskosten)) : '–'],
    ];

    for (let i = 0; i < finData.length; i++) {
      const [label, value] = finData[i];
      const xPos = i % 2 === 0 ? col1X : col2X;
      const yPos = y - Math.floor(i / 2) * rowH;

      drawText(label, xPos, yPos, 9, false, GRAY);
      drawText(value, xPos + 140, yPos, 10, true, BLACK);
    }

    y -= Math.ceil(finData.length / 2) * rowH + 30;

    // ===== RENDITEKENNZAHLEN =====
    drawText('RENDITEKENNZAHLEN', MARGIN, y, 11, true, NAVY);
    y -= 20;

    const rendData: [string, string][] = [
      ['Nettomietrendite', pct(d.nettoMietrendite)],
      ['Bruttomietrendite', pct(bruttoBase)],
      ['Eigenkapitalrendite', pct(d.ekRendite)],
    ];

    for (const [label, value] of rendData) {
      drawText(label, MARGIN, y, 9, false, GRAY);
      drawText(value, MARGIN + 200, y, 11, true, NAVY);
      y -= rowH;
    }

    addFooter();

    // ===== SEITE 2: MARKT & LAGE =====
    if (d.lageText || d.mietvergleich || d.preisvergleich) {
      page = pdf.addPage([595.28, 841.89]);
      y = 841.89 - 60;

      drawText('MARKT & LAGE', MARGIN, y, 16, true, NAVY);
      y -= 10;
      page.drawRectangle({ x: MARGIN, y: y - 2, width: 90, height: 1.5, color: NAVY });
      y -= 35;

      const drawBulletSection = (title: string, text: string) => {
        ensure(100);
        drawText(title, MARGIN, y, 11, true, NAVY);
        y -= 18;

        const bullets = extractBullets(text, 5);
        for (const bullet of bullets) {
          ensure(30);
          // Bullet point
          page.drawCircle({ x: MARGIN + 4, y: y - 3, size: 2, color: NAVY });

          // Wrap text
          const maxWidth = WIDTH - 20;
          const words = bullet.split(' ');
          let line = '';

          for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (font.widthOfTextAtSize(test, 9) > maxWidth) {
              if (line) {
                drawText(line, MARGIN + 12, y, 9, false, BLACK);
                y -= 13;
                line = word;
              } else {
                drawText(word, MARGIN + 12, y, 9, false, BLACK);
                y -= 13;
              }
            } else {
              line = test;
            }
          }
          if (line) {
            drawText(line, MARGIN + 12, y, 9, false, BLACK);
            y -= 13;
          }
          y -= 5;
        }
        y -= 15;
      };

      if (d.lageText) drawBulletSection('Standortanalyse', d.lageText);
      if (d.mietvergleich) drawBulletSection('Mietpreisvergleich', d.mietvergleich);
      if (d.preisvergleich) drawBulletSection('Kaufpreisvergleich', d.preisvergleich);

      addFooter();
    }

    // ===== SEITE 3: SZENARIOANALYSE =====
    if (d.szenario) {
      page = pdf.addPage([595.28, 841.89]);
      y = 841.89 - 60;

      drawText('SZENARIO-ANALYSE', MARGIN, y, 16, true, NAVY);
      y -= 10;
      page.drawRectangle({ x: MARGIN, y: y - 2, width: 120, height: 1.5, color: NAVY });
      y -= 35;

      const s = d.szenario;

      // Anpassungen
      drawText('Anpassungen gegenüber Basis', MARGIN, y, 11, true, NAVY);
      y -= 20;

      const adjustments: [string, string, string][] = [];

      if (s.miete && s.miete !== d.miete) {
        const diff = ((s.miete - d.miete) / d.miete) * 100;
        adjustments.push(['Kaltmiete', `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, eur(Math.round(s.miete))]);
      }
      if (s.kaufpreis && s.kaufpreis !== d.kaufpreis) {
        const diff = ((s.kaufpreis - d.kaufpreis) / d.kaufpreis) * 100;
        adjustments.push(['Kaufpreis', `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, eur(Math.round(s.kaufpreis))]);
      }
      if (s.zins != null && s.zins !== d.zins) {
        const diff = s.zins - d.zins;
        adjustments.push(['Zinssatz', `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} pp`, `${s.zins.toFixed(2)}%`]);
      }
      if (s.tilgung != null && s.tilgung !== d.tilgung) {
        const diff = s.tilgung - d.tilgung;
        adjustments.push(['Tilgung', `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} pp`, `${s.tilgung.toFixed(2)}%`]);
      }
      if (s.ek && s.ek !== d.ek) {
        const diff = ((s.ek - d.ek) / d.ek) * 100;
        adjustments.push(['Eigenkapital', `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, eur(Math.round(s.ek))]);
      }

      for (const [label, change, newVal] of adjustments) {
        drawText(label, MARGIN, y, 9, false, GRAY);
        drawText(change, MARGIN + 140, y, 9, true, NAVY);
        drawText(`→ ${newVal}`, MARGIN + 240, y, 9, false, BLACK);
        y -= 16;
      }

      y -= 25;

      // Vergleichstabelle
      drawText('Ergebnisse im Vergleich', MARGIN, y, 11, true, NAVY);
      y -= 25;

      // Header
      drawText('Kennzahl', MARGIN, y, 8, true, GRAY);
      drawText('Basis', MARGIN + 240, y, 8, true, GRAY);
      drawText('Szenario', MARGIN + 330, y, 8, true, GRAY);
      drawText('Änderung', MARGIN + 430, y, 8, true, GRAY);
      y -= 3;
      page.drawRectangle({ x: MARGIN, y: y - 1, width: WIDTH, height: 0.5, color: BORDER });
      y -= 15;

      const comparison: [string, number, number, (n: number) => string, boolean][] = [
        ['Cashflow (vor St.)', d.cashflowVorSteuer, s.cashflowVorSteuer ?? d.cashflowVorSteuer, (n) => eur(Math.round(n)), true],
        ['Nettomietrendite', d.nettoMietrendite, s.nettoRendite ?? d.nettoMietrendite, pct, true],
        ['Bruttomietrendite', bruttoBase, s.bruttorendite ?? bruttoBase, pct, true],
        ['EK-Rendite', d.ekRendite, s.ekRendite ?? d.ekRendite, pct, true],
      ];

      if (d.dscr != null && s.dscr != null) {
        comparison.push(['DSCR', d.dscr, s.dscr, (n) => num(n, 2), true]);
      }

      for (const [label, baseVal, scenVal, formatter, betterIfHigher] of comparison) {
        const diff = scenVal - baseVal;
        const diffText = diff === 0 ? '±0' : `${diff > 0 ? '+' : ''}${formatter(diff)}`;
        const diffColor = diff > 0 ? (betterIfHigher ? GREEN : RED) : diff < 0 ? (betterIfHigher ? RED : GREEN) : GRAY;

        drawText(label, MARGIN, y, 9, false, BLACK);
        drawText(formatter(baseVal), MARGIN + 240, y, 9, false, BLACK);
        drawText(formatter(scenVal), MARGIN + 330, y, 10, true, NAVY);
        drawText(diffText, MARGIN + 430, y, 9, true, diffColor);

        y -= 16;
      }

      addFooter();
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="immobilien_analyse.pdf"',
      },
    });
  } catch (e) {
    console.error('PDF error', e);
    return NextResponse.json({ error: 'PDF error' }, { status: 500 });
  }
}
