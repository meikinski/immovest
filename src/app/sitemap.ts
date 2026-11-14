import type { MetadataRoute } from 'next'
import { getAllPostsSync } from '@/lib/blog'
import { alleRechner, rechnerPfad } from '@/content/rechner'
import { SEITEN_STAND } from '@/config/seitenStand'
import { absoluteUrl } from '@/lib/strukturDaten'

/**
 * Sitemap: Startseite, Preise, Blog, alle Beiträge, alle Rechner-Seiten und die Rechtstexte.
 * lastModified ist überall ein echtes Änderungsdatum (Frontmatter, Content-Datei oder SEITEN_STAND).
 * /input-method fehlt bewusst: die Seite ist noindex.
 */
const datum = (d: string) => new Date(d)
const spaeter = (a: string, b: string) => (new Date(a) > new Date(b) ? a : b)

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsSync()
  const rechner = alleRechner()

  // Beiträge mit eingebettetem Rechner: das spätere Datum aus Beitrag und Rechner
  const postStand = (slug: string, lastModified: string) => {
    const r = rechner.find(c => c.ort.typ === 'blog' && c.ort.postSlug === slug)
    return r ? spaeter(lastModified, r.lastModified) : lastModified
  }

  const blogRoutes = posts.map(post => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: datum(postStand(post.slug, post.lastModified)),
  }))
  const neuesterBeitrag = posts.reduce((max, p) => spaeter(max, p.lastModified), '1970-01-01')

  const rechnerRoutes = rechner
    .filter(c => c.ort.typ === 'rechner')
    .map(c => ({ url: absoluteUrl(rechnerPfad(c)), lastModified: datum(c.lastModified) }))

  return [
    { url: absoluteUrl('/'), lastModified: datum(SEITEN_STAND.startseite) },
    { url: absoluteUrl('/pricing'), lastModified: datum(SEITEN_STAND.preise) },
    { url: absoluteUrl('/blog'), lastModified: datum(neuesterBeitrag) },
    ...blogRoutes,
    ...rechnerRoutes,
    { url: absoluteUrl('/impressum'), lastModified: datum(SEITEN_STAND.impressum) },
    { url: absoluteUrl('/datenschutz'), lastModified: datum(SEITEN_STAND.datenschutz) },
    { url: absoluteUrl('/agb'), lastModified: datum(SEITEN_STAND.agb) },
  ]
}
