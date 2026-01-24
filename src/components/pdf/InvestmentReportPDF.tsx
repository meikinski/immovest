import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { join } from 'path';

// Register fonts with absolute paths
const fontsDir = join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: join(fontsDir, 'NotoSans-Regular.ttf'), fontWeight: 400 },
    { src: join(fontsDir, 'NotoSans-Bold.ttf'), fontWeight: 700 },
  ],
});

// Modern Design System - matching the app
const colors = {
  navy: '#001d3d',
  orange: '#ff6b00',
  green: '#279E5D',
  red: '#D94141',
  gray: '#646464',
  grayLight: '#f0f0f0',
  border: '#eeeeee',
  white: '#ffffff',
  black: '#000000',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: 'Noto Sans',
    padding: 40,
  },

  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandText: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.navy,
  },
  reportLabel: {
    fontSize: 13,
    color: colors.gray,
  },

  // Title Section
  titleSection: {
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: colors.navy,
    marginBottom: 12,
  },
  address: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 8,
  },
  accentLine: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 32,
  },
  accentSegment1: {
    width: 80,
    height: 3,
    backgroundColor: colors.orange,
  },
  accentSegment2: {
    width: 40,
    height: 3,
    backgroundColor: colors.orange,
    opacity: 0.6,
  },
  accentSegment3: {
    width: 20,
    height: 3,
    backgroundColor: colors.orange,
    opacity: 0.3,
  },

  // KPI Cards Section
  kpiContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    border: `2px solid ${colors.border}`,
    position: 'relative',
  },
  kpiAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  kpiLabel: {
    fontSize: 8,
    color: colors.gray,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.navy,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: 'center',
  },

  // Data Cards Section
  dataCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    border: `1.5px solid ${colors.border}`,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    backgroundColor: colors.orange,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.navy,
  },

  // Data Grid
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dataRow: {
    width: '48%',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.black,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `0.5px solid ${colors.border}`,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray,
  },

  // Page 2: Market Analysis
  bulletSection: {
    marginBottom: 24,
  },
  bulletTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.navy,
    marginBottom: 12,
    paddingLeft: 12,
    borderLeft: `4px solid ${colors.orange}`,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 12,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.navy,
    marginRight: 8,
    marginTop: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: colors.black,
    lineHeight: 1.5,
  },

  // Scenario Analysis
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `0.5px solid ${colors.border}`,
  },
  adjustmentLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  adjustmentChange: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.navy,
  },
  adjustmentValue: {
    fontSize: 9,
    color: colors.black,
  },

  // Comparison Table
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: `0.5px solid ${colors.grayLight}`,
  },
  tableCol1: {
    width: '35%',
  },
  tableCol2: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '25%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.gray,
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 9,
    color: colors.black,
  },
  tableCellBold: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.navy,
  },
});

export type InvestmentReportData = {
  address: string;
  kaufpreis: number;
  flaeche: number;
  zimmer: number;
  baujahr?: number;
  miete: number;
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
  ekQuotePct?: number;
  debtServiceMonthly?: number;
  noiMonthly?: number;
  dscr?: number;
  lageText?: string;
  mietvergleich?: string;
  preisvergleich?: string;
  szenario?: {
    kaufpreis?: number;
    miete?: number;
    zins?: number;
    tilgung?: number;
    ek?: number;
    cashflowVorSteuer?: number;
    nettoRendite?: number;
    ekRendite?: number;
    bruttorendite?: number;
    noiMonthly?: number;
    dscr?: number;
    rateMonat?: number;
    abzahlungsjahr?: number | null;
    cashflowNachSteuern?: number;
  } | null;
};

// Helper functions
const formatEuro = (n: number, decimals = 0): string =>
  `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n)} €`;

const formatPercent = (n: number, decimals = 1): string =>
  `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n)} %`;

const formatNumber = (n: number, decimals = 2): string =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);

// Extract bullet points from text
const extractBullets = (text: string, maxBullets = 5): string[] => {
  const lines = text.split(/[.!?]\s+/).filter(l => l.trim().length > 20);
  return lines.slice(0, maxBullets).map(l => l.trim());
};

// Components
const KpiCard: React.FC<{
  label: string;
  value: string;
  badge: string;
  accentColor: string;
  badgeColor: string;
}> = ({ label, value, badge, accentColor, badgeColor }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiAccent, { backgroundColor: accentColor }]} />
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    <View style={[styles.badge, { backgroundColor: `${badgeColor}26` }]}>
      <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
    </View>
  </View>
);

const DataSection: React.FC<{
  title: string;
  data: Array<[string, string]>;
}> = ({ title, data }) => (
  <View style={styles.dataCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.dataGrid}>
      {data.map(([label, value], i) => (
        <View key={i} style={styles.dataRow}>
          <Text style={styles.dataLabel}>{label}</Text>
          <Text style={styles.dataValue}>{value}</Text>
        </View>
      ))}
    </View>
  </View>
);

const Footer: React.FC = () => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Erstellt am {new Date().toLocaleDateString('de-DE')} | Unverbindliche Überschlagsrechnung
    </Text>
  </View>
);

// Main PDF Document
export const InvestmentReportPDF: React.FC<{ data: InvestmentReportData }> = ({ data }) => {
  const logoPath = join(process.cwd(), 'public', 'logo.png');
  const pricePerSqm = data.flaeche > 0 ? data.kaufpreis / data.flaeche : 0;

  const ekQuotePct = (() => {
    if (data.anschaffungskosten && data.anschaffungskosten > 0) {
      return (data.ek / data.anschaffungskosten) * 100;
    }
    return typeof data.ekQuotePct === 'number' ? data.ekQuotePct : 0;
  })();

  const debtMonthly = (() => {
    if (typeof data.debtServiceMonthly === 'number') return data.debtServiceMonthly;
    if (data.darlehensSumme && (data.zins || data.tilgung)) {
      return data.darlehensSumme * ((data.zins + data.tilgung) / 100) / 12;
    }
    return 0;
  })();

  // KPI Card data
  const cfColor = data.cashflowVorSteuer >= 0 ? colors.green : colors.red;
  const cfStatus = data.cashflowVorSteuer >= 0 ? 'Positiv' : 'Negativ';

  const dscrVal = data.dscr ?? 0;
  const dscrColor = dscrVal >= 1.25 ? colors.green : dscrVal >= 1.0 ? colors.orange : colors.red;
  const dscrText = dscrVal >= 1.25 ? 'Sehr gut' : dscrVal >= 1.0 ? 'Ausreichend' : 'Kritisch';

  const ekColor = ekQuotePct >= 25 ? colors.green : ekQuotePct >= 15 ? colors.orange : colors.red;
  const ekText = ekQuotePct >= 25 ? 'Stark' : ekQuotePct >= 15 ? 'Solide' : 'Schwach';

  return (
    <Document>
      {/* Page 1: Cover & Key Metrics */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoPath} style={styles.logo} />
            <Text style={styles.brandText}>imvestr</Text>
          </View>
          <Text style={styles.reportLabel}>Investment-Report</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>IMMOBILIEN-ANALYSE</Text>
          <Text style={styles.address}>{data.address || 'Keine Adresse'}</Text>
          <View style={styles.accentLine}>
            <View style={styles.accentSegment1} />
            <View style={styles.accentSegment2} />
            <View style={styles.accentSegment3} />
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <KpiCard
            label="Cashflow (monatlich)"
            value={formatEuro(Math.round(data.cashflowVorSteuer))}
            badge={cfStatus}
            accentColor={cfColor}
            badgeColor={cfColor}
          />
          <KpiCard
            label="DSCR"
            value={formatNumber(dscrVal, 2)}
            badge={dscrText}
            accentColor={dscrColor}
            badgeColor={dscrColor}
          />
          <KpiCard
            label="Eigenkapitalquote"
            value={formatPercent(ekQuotePct, 1)}
            badge={ekText}
            accentColor={ekColor}
            badgeColor={ekColor}
          />
        </View>

        {/* Objektdaten */}
        <DataSection
          title="OBJEKTDATEN"
          data={[
            ['Kaufpreis', formatEuro(Math.round(data.kaufpreis))],
            ['Fläche', data.flaeche ? `${formatNumber(data.flaeche, 0)} m²` : '–'],
            ['Zimmer', data.zimmer != null ? String(data.zimmer) : '–'],
            ['Baujahr', data.baujahr ? String(data.baujahr) : '–'],
            ['Kaltmiete (monatlich)', formatEuro(Math.round(data.miete))],
            ['Kaufpreis/m²', data.flaeche > 0 ? formatEuro(Math.round(pricePerSqm)) : '–'],
          ]}
        />

        {/* Finanzierung */}
        <DataSection
          title="FINANZIERUNG"
          data={[
            ['Eigenkapital', formatEuro(Math.round(data.ek))],
            ['Darlehenssumme', data.darlehensSumme != null ? formatEuro(Math.round(data.darlehensSumme)) : '–'],
            ['Zinssatz', `${data.zins.toFixed(2)} %`],
            ['Tilgung', `${data.tilgung.toFixed(2)} %`],
            ['Monatliche Rate', debtMonthly ? formatEuro(debtMonthly, 0) : '–'],
            ['Gesamtinvestition', data.anschaffungskosten ? formatEuro(Math.round(data.anschaffungskosten)) : '–'],
          ]}
        />

        {/* Renditekennzahlen */}
        <DataSection
          title="RENDITEKENNZAHLEN"
          data={[
            ['Nettomietrendite', formatPercent(data.nettoMietrendite)],
            ['Bruttomietrendite', formatPercent(data.bruttoMietrendite)],
            ['Eigenkapitalrendite', formatPercent(data.ekRendite)],
          ]}
        />

        <Footer />
      </Page>

      {/* Page 2: Market & Location Analysis */}
      {(data.lageText || data.mietvergleich || data.preisvergleich) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>MARKT & LAGE</Text>
            <View style={styles.accentLine}>
              <View style={styles.accentSegment1} />
              <View style={styles.accentSegment2} />
              <View style={styles.accentSegment3} />
            </View>
          </View>

          {data.lageText && (
            <View style={styles.bulletSection}>
              <Text style={styles.bulletTitle}>Standortanalyse</Text>
              {extractBullets(data.lageText).map((bullet, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          )}

          {data.mietvergleich && (
            <View style={styles.bulletSection}>
              <Text style={styles.bulletTitle}>Mietpreisvergleich</Text>
              {extractBullets(data.mietvergleich).map((bullet, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          )}

          {data.preisvergleich && (
            <View style={styles.bulletSection}>
              <Text style={styles.bulletTitle}>Kaufpreisvergleich</Text>
              {extractBullets(data.preisvergleich).map((bullet, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          )}

          <Footer />
        </Page>
      )}

      {/* Page 3: Scenario Analysis */}
      {data.szenario && (
        <Page size="A4" style={styles.page}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>SZENARIO-ANALYSE</Text>
            <View style={styles.accentLine}>
              <View style={styles.accentSegment1} />
              <View style={styles.accentSegment2} />
              <View style={styles.accentSegment3} />
            </View>
          </View>

          {/* Adjustments */}
          <View style={styles.dataCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Anpassungen gegenüber Basis</Text>
            </View>

            {data.szenario.miete && data.szenario.miete !== data.miete && (
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentLabel}>Kaltmiete</Text>
                <Text style={styles.adjustmentChange}>
                  {((data.szenario.miete - data.miete) / data.miete * 100 >= 0 ? '+' : '')}
                  {((data.szenario.miete - data.miete) / data.miete * 100).toFixed(1)}%
                </Text>
                <Text style={styles.adjustmentValue}>→ {formatEuro(Math.round(data.szenario.miete))}</Text>
              </View>
            )}

            {data.szenario.kaufpreis && data.szenario.kaufpreis !== data.kaufpreis && (
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentLabel}>Kaufpreis</Text>
                <Text style={styles.adjustmentChange}>
                  {((data.szenario.kaufpreis - data.kaufpreis) / data.kaufpreis * 100 >= 0 ? '+' : '')}
                  {((data.szenario.kaufpreis - data.kaufpreis) / data.kaufpreis * 100).toFixed(1)}%
                </Text>
                <Text style={styles.adjustmentValue}>→ {formatEuro(Math.round(data.szenario.kaufpreis))}</Text>
              </View>
            )}

            {data.szenario.zins != null && data.szenario.zins !== data.zins && (
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentLabel}>Zinssatz</Text>
                <Text style={styles.adjustmentChange}>
                  {(data.szenario.zins - data.zins >= 0 ? '+' : '')}
                  {(data.szenario.zins - data.zins).toFixed(2)} pp
                </Text>
                <Text style={styles.adjustmentValue}>→ {data.szenario.zins.toFixed(2)}%</Text>
              </View>
            )}

            {data.szenario.ek && data.szenario.ek !== data.ek && (
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentLabel}>Eigenkapital</Text>
                <Text style={styles.adjustmentChange}>
                  {((data.szenario.ek - data.ek) / data.ek * 100 >= 0 ? '+' : '')}
                  {((data.szenario.ek - data.ek) / data.ek * 100).toFixed(1)}%
                </Text>
                <Text style={styles.adjustmentValue}>→ {formatEuro(Math.round(data.szenario.ek))}</Text>
              </View>
            )}
          </View>

          {/* Comparison Table */}
          <View style={styles.dataCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Ergebnisse im Vergleich</Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCol1]}>Kennzahl</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol2]}>Basis</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol3]}>Szenario</Text>
              <Text style={[styles.tableHeaderText, styles.tableCol4]}>Änderung</Text>
            </View>

            {[
              {
                label: 'Cashflow (vor St.)',
                base: data.cashflowVorSteuer,
                scenario: data.szenario.cashflowVorSteuer ?? data.cashflowVorSteuer,
                formatter: (n: number) => formatEuro(Math.round(n)),
                betterIfHigher: true,
              },
              {
                label: 'Nettomietrendite',
                base: data.nettoMietrendite,
                scenario: data.szenario.nettoRendite ?? data.nettoMietrendite,
                formatter: formatPercent,
                betterIfHigher: true,
              },
              {
                label: 'Bruttomietrendite',
                base: data.bruttoMietrendite,
                scenario: data.szenario.bruttorendite ?? data.bruttoMietrendite,
                formatter: formatPercent,
                betterIfHigher: true,
              },
              {
                label: 'EK-Rendite',
                base: data.ekRendite,
                scenario: data.szenario.ekRendite ?? data.ekRendite,
                formatter: formatPercent,
                betterIfHigher: true,
              },
            ].map((row, i) => {
              const diff = row.scenario - row.base;
              const diffText = diff === 0 ? '±0' : `${diff > 0 ? '+' : ''}${row.formatter(diff)}`;
              const diffColor = diff > 0
                ? (row.betterIfHigher ? colors.green : colors.red)
                : diff < 0
                ? (row.betterIfHigher ? colors.red : colors.green)
                : colors.gray;

              return (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, styles.tableCol1]}>{row.label}</Text>
                  <Text style={[styles.tableCellText, styles.tableCol2]}>{row.formatter(row.base)}</Text>
                  <Text style={[styles.tableCellBold, styles.tableCol3]}>{row.formatter(row.scenario)}</Text>
                  <Text style={[styles.tableCellBold, styles.tableCol4, { color: diffColor }]}>
                    {diffText}
                  </Text>
                </View>
              );
            })}
          </View>

          <Footer />
        </Page>
      )}
    </Document>
  );
};
