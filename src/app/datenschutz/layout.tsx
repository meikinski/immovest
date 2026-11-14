import { oeffentlicheSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = oeffentlicheSeiteMetadata({
  titel: 'Datenschutzerklärung',
  beschreibung: 'Datenschutzerklärung von imvestr: welche Daten verarbeitet werden, Zwecke und Rechtsgrundlagen, Empfänger, Speicherdauer und deine Rechte.',
  pfad: '/datenschutz',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
