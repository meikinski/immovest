import { Metadata } from 'next';
import { PREIS_JAHR, PREIS_MONAT, preis } from '@/lib/preise';

const TITEL = 'Preise & Pläne | imvestr';
const OG_DESCRIPTION = `Eine Wohnung gratis prüfen, mit Markt & Lage, KI-Einschätzung, Prognose, Szenarien und PDF-Report. Jede weitere mit Premium: ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat.`;

export const metadata: Metadata = {
  title: 'Preise & Pläne | imvestr Immobilien-Renditerechner',
  description: `Kostenlos: unbegrenzt Cashflow & Rendite und 1 Wohnung vollständig analysieren, inkl. Szenarien und PDF-Report. Premium für unbegrenzt viele Wohnungen: ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat.`,
  keywords: [
    'immobilien renditerechner preise',
    'ki immobilien analyse kosten',
    'cashflow rechner preise',
    'immobilien tool kosten',
    'rendite rechner premium',
    'immobilienscout24 import kosten',
  ],
  openGraph: {
    title: TITEL,
    description: OG_DESCRIPTION,
    url: 'https://imvestr.de/pricing',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITEL,
    description: OG_DESCRIPTION,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/pricing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
