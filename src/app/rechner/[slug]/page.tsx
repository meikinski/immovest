import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { rechnerFuerSlug, rechnerMitEigenerSeite, rechnerPfad } from '@/content/rechner';
import { RechnerInhaltBlock, RechnerLinks } from '@/components/rechner/RechnerBausteine';
import { BASE_URL, breadcrumbSchema, faqPageSchema, jsonLd, webApplicationSchema } from '@/lib/strukturDaten';

/**
 * Rechner mit eigener URL (ort.typ 'rechner'). Rechner, die in einen Blogbeitrag eingebettet sind,
 * haben hier keine Seite (404), damit es je Suchbegriff nur eine URL gibt.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return rechnerMitEigenerSeite().map(c => ({ slug: c.slug }));
}

function eigeneSeite(slug: string) {
  const c = rechnerFuerSlug(slug);
  return c && c.ort.typ === 'rechner' ? c : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = eigeneSeite(slug);
  if (!c) return { title: { absolute: 'Seite nicht gefunden | imvestr' }, robots: { index: false } };
  const url = `${BASE_URL}${rechnerPfad(c)}`;
  return {
    title: { absolute: c.title },
    description: c.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      url,
      siteName: 'imvestr',
      title: c.h1,
      description: c.metaDescription,
      images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: c.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.h1,
      description: c.metaDescription,
      images: [`${BASE_URL}/og-image.png`],
    },
  };
}

export default async function RechnerSeite({ params }: Props) {
  const { slug } = await params;
  const c = eigeneSeite(slug);
  if (!c) notFound();

  const pfad = rechnerPfad(c);
  const strukturDaten = [
    webApplicationSchema({ name: c.h1, beschreibung: c.metaDescription, pfad }),
    faqPageSchema(c.faq),
    breadcrumbSchema([
      { name: 'Startseite', pfad: '/' },
      { name: c.h1, pfad },
    ]),
  ];

  return (
    <>
      {strukturDaten.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(d) }} />
      ))}
      <Header variant="static" />
      <main className="bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <nav aria-label="Brotkrumen" className="mb-10 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="font-medium text-[#001d3d] transition-colors hover:text-[#ff6b00]">Startseite</Link>
            <span className="text-gray-300">›</span>
            <span className="max-w-xs truncate text-gray-500">{c.h1}</span>
          </nav>
          <h1 className="mb-8 text-4xl font-extrabold leading-tight tracking-tighter text-[#001d3d]">{c.h1}</h1>
          <RechnerInhaltBlock c={c} />
          <RechnerLinks c={c} />
        </div>
      </main>
      <Footer />
    </>
  );
}
