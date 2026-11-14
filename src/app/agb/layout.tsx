import { oeffentlicheSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = oeffentlicheSeiteMetadata({
  titel: 'Allgemeine Geschäftsbedingungen (AGB)',
  beschreibung: 'Allgemeine Geschäftsbedingungen von imvestr: Leistungsumfang, Nutzerkonto, Premium-Abonnement, Widerrufsrecht, Haftung und Nutzungsrechte.',
  pfad: '/agb',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
