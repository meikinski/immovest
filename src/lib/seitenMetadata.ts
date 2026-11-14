import type { Metadata } from 'next';

/**
 * Metadaten für App-Seiten (Eingabeschritte, Ergebnis, Konto): eigener Titel, nicht im Index.
 * canonical/openGraph.url: null, damit nicht der Startseiten-Canonical aus dem Root-Layout geerbt wird.
 */
export function appSeiteMetadata(titel: string): Metadata {
  const voll = `${titel} | imvestr`;
  return {
    title: voll,
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: { title: voll, url: null },
    twitter: { title: voll },
  };
}

/** Titel der Eingabeschritte und des Ergebnisses (Labels wie in ProgressIndicator) */
export const SCHRITT_TITEL: Record<string, string> = {
  a: 'Schritt 1 von 4: Kaufpreis',
  a2: 'Schritt 2 von 4: Objektdaten',
  b: 'Schritt 3 von 4: Miete & Kosten',
  c: 'Schritt 4 von 4: Finanzierung',
  pruefen: 'Angaben prüfen',
  tabs: 'Ergebnis deiner Analyse',
};

/**
 * Metadaten für öffentliche Seiten ohne eigenes Suchziel (Impressum, Datenschutz, AGB):
 * eigener Titel, eigene Beschreibung und ein Canonical auf sich selbst, statt Titel und Canonical
 * der Startseite aus dem Root-Layout zu erben (Google wertet sie sonst als Duplikate von /).
 */
export function oeffentlicheSeiteMetadata(o: { titel: string; beschreibung: string; pfad: string }): Metadata {
  const voll = `${o.titel} | imvestr`;
  const url = `https://imvestr.de${o.pfad}`;
  return {
    title: { absolute: voll },
    description: o.beschreibung,
    alternates: { canonical: url },
    openGraph: { title: voll, description: o.beschreibung, url, type: 'website', locale: 'de_DE', siteName: 'imvestr' },
    twitter: { card: 'summary', title: voll, description: o.beschreibung },
  };
}
