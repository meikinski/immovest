import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wohnung eingeben: Link, Foto oder manuell | imvestr',
  description: 'Link aus ImmoScout24, Immowelt oder Kleinanzeigen einfügen, Exposé-Foto scannen oder Daten manuell eingeben. Kennzahlen sofort und ohne Anmeldung.',
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
    title: 'Wohnung eingeben: Link, Foto oder manuell | imvestr',
    description: 'Link aus ImmoScout24, Immowelt oder Kleinanzeigen einfügen, Exposé-Foto scannen oder manuell eingeben.',
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
