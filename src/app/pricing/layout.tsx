import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preise & Pläne | ImVestr Immobilien-Renditerechner',
  description: 'Wähle den perfekten Plan für deine Immobilienanalyse. Kostenlos starten oder Premium-Features nutzen für unbegrenzte Analysen, KI-Import und erweiterte Szenarien.',
  keywords: [
    'immobilien renditerechner preise',
    'ki immobilien analyse kosten',
    'cashflow rechner preise',
    'immobilien tool kosten',
    'rendite rechner premium',
    'immobilienscout24 import kosten',
  ],
  openGraph: {
    title: 'Preise & Pläne | ImVestr',
    description: 'Kostenlos starten oder Premium-Features nutzen für unbegrenzte Immobilienanalysen.',
    url: 'https://imvestr.de/pricing',
    type: 'website',
    locale: 'de_DE',
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
