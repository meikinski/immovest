/**
 * Datum der letzten inhaltlichen Änderung statischer Seiten, für lastModified in der Sitemap.
 * Bei einer sichtbaren Änderung der Seite (Text, Preise, Angebot) hier mitändern.
 * Kein Build-Zeitstempel: der würde bei jedem Deploy ein neues Datum melden, und Google
 * ignoriert lastmod dann für die ganze Domain.
 */
export const SEITEN_STAND = {
  // Startseite und /pricing teilen PricingSection und config/pricing.ts (letzte Änderung #500)
  startseite: '2026-11-14',
  preise: '2026-11-14',
  // Letzter Commit der Seitendatei (ee7af66)
  impressum: '2026-01-16',
  datenschutz: '2026-01-16',
  agb: '2026-01-16',
} as const;
