import { Metadata } from 'next';

const titel = 'Preise & Pläne | imvestr Immobilien-Renditerechner';
const beschreibung = 'Cashflow & Rendite immer kostenlos, 1 vollständige Analyse mit Markt, Prognose, Szenarien & PDF-Report gratis. Mit Premium prüfst du unbegrenzt weitere Wohnungen.';

export const metadata: Metadata = {
  title: titel,
  description: beschreibung,
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
    description: beschreibung,
    url: 'https://imvestr.de/pricing',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preise & Pläne | imvestr',
    description: beschreibung,
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
