import type { MetadataRoute } from 'next'

/**
 * robots.txt. Gesperrt sind die API, der Sentry-Tunnel und die Bereiche, die eine Anmeldung voraussetzen
 * (Konto-Seiten). Erlaubt bleiben die Eingabeschritte /step/* (für Gäste nutzbar, tragen noindex)
 * sowie /sign-in und /sign-up (noindex), damit Google das noindex dort sieht.
 */
const ANGEMELDETE_BEREICHE = ['/dashboard', '/analysen', '/abo', '/profile', '/hilfe']

const DISALLOW = ['/api/', '/monitoring', ...ANGEMELDETE_BEREICHE]

// KI-Crawler ausdrücklich erlauben (Answer Engine Optimization), mit denselben Sperren
const KI_CRAWLER = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...KI_CRAWLER.map(userAgent => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: 'https://imvestr.de/sitemap.xml',
  }
}
