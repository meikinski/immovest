/**
 * Preise, Pläne und Preis-Texte an einer Stelle (Single Source of Truth).
 *
 * Die tatsächlichen Beträge kommen aus Stripe (Price-IDs in den Env-Variablen);
 * die Zahlen hier müssen dazu passen.
 *
 * Aufteilung:
 * - Kostenlos: unbegrenzt Cashflow & Rendite (KPI) + GRATIS_ANALYSEN vollständige Analyse(n) mit allem.
 *   Analysen speichern ist kostenlos.
 * - Premium: unbegrenzt viele vollständige Analysen.
 * Der einzige Unterschied ist, wie viele Wohnungen man vollständig analysieren kann.
 */

// ---------- Zahlen ----------

export const PREIS_MONAT = 12.99;
export const PREIS_JAHR = 69;

export const PREIS_JAHR_PRO_MONAT = PREIS_JAHR / 12;
export const PREIS_MONAT_AUF_JAHR = PREIS_MONAT * 12;
export const ERSPARNIS_JAHR = PREIS_MONAT_AUF_JAHR - PREIS_JAHR;
export const ERSPARNIS_JAHR_PCT = Math.round((ERSPARNIS_JAHR / PREIS_MONAT_AUF_JAHR) * 100);

/** Kostenlose vollständige Analysen vor Premium (mit Markt, Prognose, Szenarien und PDF-Report) */
export const GRATIS_ANALYSEN = 1;

/** "1 vollständige Analyse" bzw. "3 vollständige Analysen" für Texte */
export const gratisText = GRATIS_ANALYSEN === 1 ? '1 vollständige Analyse' : `${GRATIS_ANALYSEN} vollständige Analysen`;

/** Betrag deutsch formatiert, ganze Euro ohne Nachkommastellen ("69"), sonst mit zwei ("12,99") */
export function preis(v: number): string {
  const ganz = Math.abs(v - Math.round(v)) < 0.005;
  return v.toLocaleString('de-DE', { minimumFractionDigits: ganz ? 0 : 2, maximumFractionDigits: 2 });
}

// ---------- Pläne ----------

export type Abrechnung = 'yearly' | 'monthly';

export interface Gruenderpreis {
  /** Neuer Jahrespreis in Euro (der reguläre PREIS_JAHR wird durchgestrichen) */
  preis: number;
  /** Stripe-Price-ID für den Gründerpreis */
  priceId: string;
  /** Kurzer Hinweis, z. B. "Gründerpreis für die ersten 100" */
  hinweis: string;
}

/**
 * FOUNDER-PREIS (Task B): Hier den Gründerpreis eintragen, dann erscheint er in der Jahresoption
 * der PricingSection (durchgestrichene 69 € + neuer Preis). `null` = ausgeblendet.
 */
export const GRUENDERPREIS: Gruenderpreis | null = null;

export const PLAENE = {
  free: {
    titel: 'Kostenlos',
    preis: '0 €',
    merkmale: [
      GRATIS_ANALYSEN === 1 ? '1 Wohnung vollständig analysieren' : `${GRATIS_ANALYSEN} Wohnungen vollständig analysieren`,
      'Cashflow & Rendite unbegrenzt',
      'Analysen speichern',
    ],
    cta: 'Kostenlos starten',
    href: '/input-method',
  },
  premium: {
    titel: 'Premium',
    hauptzeile: 'Unbegrenzt viele Wohnungen vollständig analysieren',
    standard: 'yearly' as Abrechnung,
    cta: 'Premium starten',
    optionen: {
      yearly: {
        label: 'Jährlich',
        betrag: PREIS_JAHR,
        preisText: `${preis(PREIS_JAHR)} €`,
        zeitraum: 'im Jahr',
        hinweis: `nur ${preis(PREIS_JAHR_PRO_MONAT)} € pro Monat`,
        ersparnis: `${ERSPARNIS_JAHR_PCT} % günstiger als monatlich`,
        priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ?? '',
      },
      monthly: {
        label: 'Monatlich',
        betrag: PREIS_MONAT,
        preisText: `${preis(PREIS_MONAT)} €`,
        zeitraum: 'pro Monat',
        hinweis: 'monatlich kündbar',
        ersparnis: null as string | null,
        priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '',
      },
    },
  },
} as const;

// ---------- Texte ----------

export const PRICING_TEXTE = {
  headline: 'Eine Wohnung gratis prüfen. Jede weitere mit Premium.',
  /** Inhalt jeder vollständigen Analyse, einmal über den Karten */
  analyseTitel: 'Jede vollständige Analyse enthält',
  analyseInhalt: [
    'Markt & Lage',
    'KI-Einschätzung',
    'Prognose',
    'Szenarien & Stresstests',
    'PDF-Report für die Bank',
  ],
  /** Entspricht AGB § 4 (3)/(4): automatische Verlängerung, Kündigung jederzeit zum Ende der Laufzeit */
  vertrauen: 'Sichere Zahlung über Stripe · Kreditkarte & SEPA · Jahresabo endet automatisch zum Laufzeitende, wenn du kündigst',
};

export const PRICING_FAQ: Array<{ frage: string; antwort: string }> = [
  {
    frage: 'Was ist kostenlos?',
    antwort: `Cashflow und Rendite rechnest du unbegrenzt kostenlos. Dazu kommt ${gratisText} mit Markt & Lage, KI-Einschätzung, Prognose, Szenarien, Stresstests und PDF-Report für die Bank. Analysen speichern ist ebenfalls kostenlos.`,
  },
  {
    frage: 'Was passiert nach meiner Gratis-Analyse?',
    antwort: `Deine Analyse bleibt vollständig erhalten. Cashflow und Rendite kannst du weiter unbegrenzt rechnen. Für jede weitere Wohnung mit Markt, KI-Einschätzung, Prognose, Szenarien und PDF-Report brauchst du Premium: ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat.`,
  },
  {
    frage: 'Kann ich kündigen?',
    antwort: 'Ja, jederzeit über „Abo & Zahlung“ in deinem Konto. Das Monatsabo endet zum Ende des laufenden Monats, das Jahresabo zum Ende des laufenden Jahres. Bis dahin nutzt du Premium weiter, danach verlängert sich nichts mehr.',
  },
  {
    frage: 'Brauche ich eine Kreditkarte für die Gratis-Analyse?',
    antwort: 'Nein. Du meldest dich nur mit deiner E-Mail-Adresse an. Zahlungsdaten gibst du erst ein, wenn du Premium abschließt.',
  },
];

/** FAQ der Preisseite als schema.org FAQPage */
export const PRICING_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map(f => ({ '@type': 'Question', name: f.frage, acceptedAnswer: { '@type': 'Answer', text: f.antwort } })),
};

/** Homepage-FAQ "Was ist kostenlos, was kostet Premium?" */
export const FAQ_KOSTENLOS_PREMIUM = `Cashflow und Rendite rechnest du unbegrenzt kostenlos. ${gratisText} mit Markt & Lage, KI-Einschätzung, Prognose, Szenarien, Stresstests und PDF-Report für die Bank ist gratis, Analysen speichern ebenfalls. Premium brauchst du erst ab der 2. Wohnung: Damit analysierst du unbegrenzt viele Wohnungen vollständig, für ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat.`;
