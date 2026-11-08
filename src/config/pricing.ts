/**
 * Preismodell, Preise und Preis-Texte an einer Stelle (Single Source of Truth).
 *
 * Die tatsächlichen Beträge kommen aus Stripe (Price-IDs in den Env-Variablen);
 * die Zahlen hier müssen dazu passen.
 *
 * Das Modell (drei Stufen):
 * 1. Ohne Anmeldung, 0 €: Kennzahlen (Cashflow, Rendite, DSCR) für jede Wohnung, unbegrenzt.
 * 2. Kostenloses Konto, 0 €: GRATIS_ANALYSEN Wohnung(en) vollständig analysiert: Steuern & AfA,
 *    Markt & Lage, KI-Einschätzung, Prognose, Szenarien/Stresstests, PDF-Report. Nicht speicherbar.
 * 3. Premium: jede weitere Wohnung vollständig analysiert und Analysen speichern,
 *    PREIS_JAHR im Jahr oder PREIS_MONAT im Monat.
 * Speichern gibt es nur mit Premium (serverseitig geprüft in /api/analysis und /api/scenarios).
 * Anmelden muss man sich nur für die vollständige Analyse, bezahlen erst ab der 2. vollständigen Analyse.
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

/**
 * Gründerpreis: wird nicht hier, sondern über Env-Variablen gesteuert (siehe src/lib/founderOffer.ts),
 * damit er ohne neuen Code ein- und ausgeschaltet werden kann. Der Client liest ihn mit useFounderOffer().
 */
export const gruenderpreisHinweis = (endsAtLabel: string) =>
  `Gründerpreis bis ${endsAtLabel}. Der Preis bleibt, solange dein Abo läuft.`;

export const PLAENE = {
  premium: {
    titel: 'Premium',
    hauptzeile: 'Jede weitere Wohnung komplett',
    /** Zweite Unterzeile der Premium-Spalte */
    zusatz: 'Analysen speichern inklusive',
    standard: 'yearly' as Abrechnung,
    cta: 'Premium starten',
    optionen: {
      yearly: {
        label: 'Jährlich',
        betrag: PREIS_JAHR,
        preisText: `${preis(PREIS_JAHR)} €`,
        zeitraum: 'im Jahr',
        hinweis: `${preis(PREIS_JAHR)} € im Jahr · ${preis(PREIS_JAHR_PRO_MONAT)} € pro Monat`,
        kurzHinweis: `nur ${preis(PREIS_JAHR_PRO_MONAT)} € pro Monat`,
        ersparnis: `${ERSPARNIS_JAHR_PCT} % günstiger als monatlich`,
        ersparnisKurz: `−${ERSPARNIS_JAHR_PCT} %`,
        priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID ?? '',
      },
      monthly: {
        label: 'Monatlich',
        betrag: PREIS_MONAT,
        preisText: `${preis(PREIS_MONAT)} €`,
        zeitraum: 'pro Monat',
        hinweis: `${preis(PREIS_MONAT)} € pro Monat, monatlich kündbar`,
        kurzHinweis: 'monatlich kündbar',
        ersparnis: null as string | null,
        ersparnisKurz: null as string | null,
        priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID ?? '',
      },
    },
  },
} as const;

// ---------- Stufen (Preisübersicht) ----------

const gratisWohnungen = GRATIS_ANALYSEN === 1 ? '1 Wohnung' : `${GRATIS_ANALYSEN} Wohnungen`;

/** Die zwei kostenlosen Stufen; Premium steht in PLAENE.premium (mit Abrechnungswahl) */
export const STUFEN = {
  ohneAnmeldung: {
    titel: 'Ohne Anmeldung',
    preis: '0 €',
    hauptzeile: 'Kennzahlen für jede Wohnung',
    unterzeilen: ['Cashflow, Rendite, DSCR · unbegrenzt'],
    cta: 'Wohnung prüfen',
    href: '/input-method',
  },
  konto: {
    titel: 'Kostenloses Konto',
    preis: '0 €',
    hauptzeile: `${gratisWohnungen} komplett`,
    unterzeilen: ['Steuern, Markt, KI, Prognose, Szenarien, PDF'],
    cta: 'Kostenlos registrieren',
    href: '/sign-up',
  },
} as const;

/** Kurze Zeilen für Hero und Schnell-Check */
export const MODELL_KURZ = {
  hero: `Kennzahlen ohne Anmeldung · ${gratisWohnungen} komplett gratis mit E-Mail`,
  schnellCheck: `Komplett mit Steuern, Markt und Prognose: kostenloses Konto, ${gratisWohnungen} gratis.`,
  analyseIntro: `Das bekommst du für jede Wohnung, die du komplett prüfst. ${GRATIS_ANALYSEN === 1 ? 'Die erste ist' : `Die ersten ${GRATIS_ANALYSEN} sind`} gratis.`,
};

// ---------- Texte ----------

export const PRICING_TEXTE = {
  headline: 'Kostenlos starten. Bezahlen erst ab der zweiten Wohnung.',
  /** Kündigung bewusst nicht hier, sondern in der FAQ (AGB § 4 (3)/(4)) */
  vertrauen: 'Sichere Zahlung über Stripe · Kreditkarte & SEPA',
};

/** FAQ für Homepage und /pricing (gleicher Inhalt) */
export const PRICING_FAQ: Array<{ frage: string; antwort: string }> = [
  {
    frage: 'Was ist kostenlos, was kostet Premium?',
    antwort: `Cashflow, Rendite und DSCR rechnest du ohne Anmeldung für jede Wohnung. Mit einem kostenlosen Konto prüfst du ${gratisWohnungen} komplett. Premium kostet ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat: Damit prüfst du jede weitere Wohnung komplett und speicherst deine Analysen.`,
  },
  {
    frage: 'Wann muss ich mich anmelden?',
    antwort: 'Für die Kennzahlen gar nicht. Für die vollständige Analyse mit Markt, KI und Prognose brauchst du ein kostenloses Konto. Ab der zweiten Wohnung brauchst du Premium.',
  },
  {
    frage: 'Brauche ich Vorwissen?',
    antwort: 'Nein. Jeder Fachbegriff ist erklärt, und das Ergebnis steht immer zuerst in einem Satz. Profis finden alle Kennzahlen und Formeln in der Detailansicht.',
  },
  {
    frage: 'Woher kommen die Marktdaten?',
    antwort: 'Aus einer aktuellen Recherche zu Angeboten und Vergleichsdaten für die Lage der Wohnung. Die Quellen werden in der Analyse angezeigt.',
  },
  {
    frage: 'Kann ich den Report bei der Bank vorlegen?',
    antwort: 'Ja. Er fasst Kaufpreis, Finanzierung, Monatsrechnung, Kapitaldienstfähigkeit und einen Stresstest zusammen. Er ersetzt keine Unterlagen wie Grundbuchauszug oder Wertgutachten.',
  },
  {
    frage: 'Kann ich kündigen?',
    antwort: 'Ja, jederzeit über „Abo & Zahlung“ in deinem Konto. Das Abo endet zum Ende der laufenden Laufzeit (Monat oder Jahr) und verlängert sich danach nicht mehr.',
  },
];

/** FAQ als schema.org FAQPage */
export const PRICING_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQ.map(f => ({ '@type': 'Question', name: f.frage, acceptedAnswer: { '@type': 'Answer', text: f.antwort } })),
};
