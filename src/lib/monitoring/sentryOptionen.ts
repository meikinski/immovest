import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';
import { bereinigeBreadcrumb, bereinigeEvent } from '@/lib/monitoring/datenschutz';

/**
 * Gemeinsame Sentry-Optionen für Browser, Node und Edge.
 * Ohne NEXT_PUBLIC_SENTRY_DSN bleibt Sentry aus (lokal, Previews ohne Variable).
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

export function sentryBasisOptionen() {
  return {
    dsn: SENTRY_DSN,
    enabled: !!SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Keine IP, keine Cookies, keine Header, keine Request-Bodies
    sendDefaultPii: false,
    // Nur Fehler, kein Performance-Tracing (hält das kostenlose Kontingent frei)
    tracesSampleRate: 0,
    maxBreadcrumbs: 30,
    beforeSend(event: ErrorEvent) {
      return bereinigeEvent(event);
    },
    beforeBreadcrumb(crumb: Breadcrumb) {
      return bereinigeBreadcrumb(crumb);
    },
  };
}
