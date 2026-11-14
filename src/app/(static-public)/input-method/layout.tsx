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
  // Eingabeformular der App ohne eigenen Suchwert: nicht indexieren, Links aber verfolgen
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
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
