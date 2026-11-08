import { Metadata } from 'next';
import { PREIS_JAHR, PREIS_MONAT, preis } from '@/lib/preise';

const TITEL = 'Preise & Pläne | imvestr';
const DESCRIPTION = `Kennzahlen ohne Anmeldung, 1 Wohnung komplett gratis mit kostenlosem Konto: Steuern, Markt, KI, Prognose, Szenarien und PDF-Report. Jede weitere Wohnung mit Premium für ${preis(PREIS_JAHR)} € im Jahr oder ${preis(PREIS_MONAT)} € im Monat.`;

export const metadata: Metadata = {
  title: TITEL,
  description: DESCRIPTION,
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
    description: DESCRIPTION,
    url: 'https://imvestr.de/pricing',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITEL,
    description: DESCRIPTION,
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
