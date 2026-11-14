import type { Metadata } from 'next';
import { SignUpSeite } from '@/components/auth/SignUpSeite';

// Eigener Titel, nicht im Index; canonical: null verhindert, dass der Startseiten-Canonical aus dem Root-Layout geerbt wird
export const metadata: Metadata = {
  title: 'Kostenlos registrieren | imvestr',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
  openGraph: { title: 'Kostenlos registrieren | imvestr', url: null },
  twitter: { title: 'Kostenlos registrieren | imvestr' },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const erster = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <SignUpSeite source={erster(params.source)} redirectUrl={erster(params.redirect_url)} />;
}
