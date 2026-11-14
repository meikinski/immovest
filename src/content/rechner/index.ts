import { getAllPostsSync } from '@/lib/blog';
import { pruefeRechnerInhalte, rechnerPfad, type BeliebigerRechnerInhalt } from './typen';
import cashflowImmobilieBerechnen from './cashflow-immobilie-berechnen';

/**
 * Alle Rechner-Seiten. Neue Seite: Datei unter src/content/rechner/<slug>.ts anlegen und hier eintragen.
 * Die Prüfung läuft beim ersten Zugriff. Fehlerhafte Inhalte lassen den Build scheitern
 * (generateStaticParams, Sitemap und Blogseiten greifen hierauf zu).
 */
const INHALTE: BeliebigerRechnerInhalt[] = [cashflowImmobilieBerechnen];

let geprueft: BeliebigerRechnerInhalt[] | null = null;

export function alleRechner(): BeliebigerRechnerInhalt[] {
  if (geprueft) return geprueft;
  const fehler = pruefeRechnerInhalte(INHALTE, getAllPostsSync().map(p => p.slug));
  if (fehler.length > 0) {
    throw new Error(`Rechner-Inhalte sind unvollständig:\n${fehler.map(f => `  - ${f}`).join('\n')}`);
  }
  geprueft = INHALTE;
  return geprueft;
}

/** Rechner mit eigener Seite unter /rechner/<slug> */
export function rechnerMitEigenerSeite(): BeliebigerRechnerInhalt[] {
  return alleRechner().filter(c => c.ort.typ === 'rechner');
}

export function rechnerFuerSlug(slug: string): BeliebigerRechnerInhalt | undefined {
  return alleRechner().find(c => c.slug === slug);
}

/** Rechner, der in diesen Blogbeitrag eingebettet ist */
export function rechnerImBlogPost(postSlug: string): BeliebigerRechnerInhalt | undefined {
  return alleRechner().find(c => c.ort.typ === 'blog' && c.ort.postSlug === postSlug);
}

/** Rechner, auf den ein Blogbeitrag per Link-Block verweist (erster Treffer in verlinktVon) */
export function passenderRechnerFuerBlogPost(postSlug: string): BeliebigerRechnerInhalt | undefined {
  return alleRechner().find(c => c.verlinktVon?.includes(postSlug));
}

export { rechnerPfad };
