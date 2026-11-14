import type { Metadata } from 'next';
import { NichtGefunden } from '@/components/NichtGefunden';

/**
 * 404: eigener Titel und eigene Beschreibung statt der Startseiten-Metadaten.
 * Kein Canonical: die Seite erscheint unter jeder unbekannten URL und hat keine eigene Adresse,
 * auf die sie verweisen könnte. Ein Canonical auf / (bisher geerbt) wäre falsch. Next setzt noindex.
 */
export const metadata: Metadata = {
  title: { absolute: 'Seite nicht gefunden (404) | imvestr' },
  description: 'Diese Seite gibt es bei imvestr nicht oder nicht mehr. Von hier geht es zur Startseite oder zu den Preisen.',
  alternates: { canonical: null },
  openGraph: { title: 'Seite nicht gefunden (404) | imvestr', url: null },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NichtGefunden />;
}
