import * as Sentry from '@sentry/nextjs';
import type { Instrumentation } from 'next';

/** Fehlerüberwachung auf dem Server (Node und Edge), siehe docs/MONITORING.md */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

/**
 * Unbehandelte Fehler in Server-Komponenten, Route-Handlern und Middleware.
 * Fehler in /api-Routen, die mitMonitoring nicht abfängt (z. B. beim Laden des Moduls, fehlender API-Schlüssel),
 * zählen zusätzlich als 5xx der Route, damit der Alarm „mehr als 5 pro Stunde" sie mitzählt.
 */
export const onRequestError: Instrumentation.onRequestError = async (fehler, request, kontext) => {
  Sentry.captureRequestError(fehler, request, kontext);
  if (kontext.routeType === 'route' && kontext.routePath.startsWith('/api/')) {
    const { melde5xx } = await import('@/lib/monitoring/apiRoute');
    await melde5xx(`${request.method} ${kontext.routePath}`, 500);
  }
};
