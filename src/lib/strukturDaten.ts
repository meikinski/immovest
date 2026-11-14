import type { BreadcrumbList, FAQPage, WebApplication, WithContext } from 'schema-dts';

/**
 * JSON-LD für Rechner- und Blogseiten. Die Typen aus schema-dts (generiert aus dem schema.org-Vokabular)
 * prüfen beim Build, dass nur gültige Eigenschaften der jeweiligen schema.org-Typen verwendet werden.
 */

export const BASE_URL = 'https://imvestr.de';

export const absoluteUrl = (pfad: string) => (pfad === '/' ? BASE_URL : `${BASE_URL}${pfad}`);

export function webApplicationSchema(o: { name: string; beschreibung: string; pfad: string }): WithContext<WebApplication> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: o.name,
    description: o.beschreibung,
    url: absoluteUrl(o.pfad),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    inLanguage: 'de-DE',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    provider: { '@type': 'Organization', name: 'imvestr', url: BASE_URL },
  };
}

export function faqPageSchema(eintraege: Array<{ frage: string; antwort: string }>): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: eintraege.map(e => ({
      '@type': 'Question',
      name: e.frage,
      acceptedAnswer: { '@type': 'Answer', text: e.antwort },
    })),
  };
}

/** Breadcrumb: alle Stufen mit Pfad, die letzte (aktuelle Seite) ebenfalls mit URL */
export function breadcrumbSchema(stufen: Array<{ name: string; pfad: string }>): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: stufen.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: absoluteUrl(s.pfad),
    })),
  };
}

/** Für <script type="application/ld+json">: "<" maskieren, damit kein Text das Script-Tag beenden kann */
export function jsonLd(daten: unknown): string {
  return JSON.stringify(daten).replace(/</g, '\\u003c');
}
