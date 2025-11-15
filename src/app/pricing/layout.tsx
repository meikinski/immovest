import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preise & Pläne | ImVestr Immobilien-Renditerechner',
  description: 'Wähle den perfekten Plan für deine Immobilienanalyse. Kostenlos starten oder Premium-Features nutzen für unbegrenzte Analysen, KI-Import und erweiterte Szenarien.',
  openGraph: {
    title: 'Preise & Pläne | ImVestr',
    description: 'Kostenlos starten oder Premium-Features nutzen für unbegrenzte Immobilienanalysen.',
    url: 'https://immovestr.de/pricing',
  },
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
