import { Metadata } from 'next';
import { PREIS_JAHR, PREIS_MONAT, preis } from '@/lib/preise';

const OG_DESCRIPTION = 'Deine erste Analyse enthält alles, inkl. Szenarien und PDF-Report. Premium für unbegrenzte Immobilienanalysen.';

export const metadata: Metadata = {
  title: 'Preise & Pläne | imvestr Immobilien-Renditerechner',
  description: `Kostenlos starten: unbegrenzte KPI-Berechnungen und 1 vollständige Analyse inkl. Szenarien und PDF-Report. Premium für unbegrenzte Analysen: ${preis(PREIS_MONAT)} € im Monat oder ${preis(PREIS_JAHR)} € im Jahr.`,
  keywords: [
    'immobilien renditerechner preise',
    'ki immobilien analyse kosten',
    'cashflow rechner preise',
    'immobilien tool kosten',
    'rendite rechner premium',
    'immobilienscout24 import kosten',
  ],
  openGraph: {
    title: 'Preise & Pläne | imvestr',
    description: OG_DESCRIPTION,
    url: 'https://imvestr.de/pricing',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preise & Pläne | imvestr',
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
