import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eingabemethoden | ImVestr - KI-Import oder manuelle Eingabe',
  description: 'Wähle deine bevorzugte Eingabemethode: KI-gestützter Import von ImmoScout24 & Immowelt, manuelle Eingabe oder Excel-Upload. Starte jetzt deine Immobilienanalyse.',
  keywords: [
    'immobilie analysieren',
    'immobilienscout24 url import',
    'immowelt daten import',
    'foto analyse immobilie',
    'ki immobilien datenextraktion',
    'immobilie eingeben',
    'renditerechner starten',
  ],
  openGraph: {
    title: 'Eingabemethoden | ImVestr',
    description: 'KI-Import von ImmoScout24 & Immowelt oder manuelle Dateneingabe - du entscheidest.',
    url: 'https://imvestr.de/input-method',
    type: 'website',
    locale: 'de_DE',
  },
  alternates: {
    canonical: '/input-method',
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

export default function InputMethodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
