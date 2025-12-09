import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eingabemethoden | ImVestr - KI-Import oder manuelle Eingabe',
  description: 'Wähle deine bevorzugte Eingabemethode: KI-gestützter Import von ImmoScout24 & Immowelt, manuelle Eingabe oder Excel-Upload. Starte jetzt deine Immobilienanalyse.',
  openGraph: {
    title: 'Eingabemethoden | ImVestr',
    description: 'KI-Import von ImmoScout24 & Immowelt oder manuelle Dateneingabe - du entscheidest.',
    url: 'https://imvestr.de/input-method',
  },
  alternates: {
    canonical: '/input-method',
  },
};

export default function InputMethodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
