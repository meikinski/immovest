import type { Metadata } from 'next';
import { SignInSeite } from '@/components/auth/SignInSeite';

// Eigener Titel, nicht im Index; canonical: null verhindert, dass der Startseiten-Canonical aus dem Root-Layout geerbt wird
export const metadata: Metadata = {
  title: 'Anmelden | imvestr',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
  openGraph: { title: 'Anmelden | imvestr', url: null },
  twitter: { title: 'Anmelden | imvestr' },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const erster = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  return <SignInSeite redirectUrl={erster(params.redirect_url)} />;
}
