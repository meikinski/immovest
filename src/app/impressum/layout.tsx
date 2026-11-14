import { oeffentlicheSeiteMetadata } from '@/lib/seitenMetadata';

export const metadata = oeffentlicheSeiteMetadata({
  titel: 'Impressum',
  beschreibung: 'Impressum von imvestr: Anbieterin, Kontakt, Umsatzsteuer-ID, inhaltlich Verantwortliche und Hinweise zur Streitbeilegung.',
  pfad: '/impressum',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
