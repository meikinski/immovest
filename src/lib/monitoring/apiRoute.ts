import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { hashNutzerId } from '@/lib/monitoring/datenschutz';

/**
 * Überwachung für /api-Routen. Jede Antwort mit Status ≥ 500 und jeder geworfene Fehler wird gemeldet:
 * mit Routenname, HTTP-Status und gehashter Nutzer-ID, ohne Body, Query oder Header.
 *
 * Zwei Arten von Ereignissen:
 * - Geworfene Fehler als Exception (normale Gruppierung nach Stacktrace → Alarm „neuer Fehler")
 * - Jede 5xx-Antwort zusätzlich als Meldung mit Fingerprint je Route. Alle 5xx einer Route landen so in
 *   einem Issue, und der Alarm „mehr als 5 Ereignisse pro Stunde" gilt pro Route.
 */

type Handler<A extends unknown[]> = (...args: A) => Response | Promise<Response>;

export const API_5XX_TAG = 'api_5xx';

async function gehashterNutzer(): Promise<string | null> {
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    return userId ? await hashNutzerId(userId) : null;
  } catch {
    return null; // z. B. Route ohne Clerk-Kontext
  }
}

type Kontext = Record<string, string | number | boolean | null | undefined>;

function setzeScope(scope: Sentry.Scope, route: string, status: number, nutzer: string | null, kontext?: Kontext) {
  scope.setTag('route', route);
  scope.setTag('method', route.split(' ')[0] ?? '');
  scope.setTag('status', String(status));
  if (nutzer) scope.setUser({ id: nutzer });
  if (kontext) scope.setContext('diagnose', kontext);
}

/**
 * Ursache eines abgefangenen Fehlers melden, wenn die Route selbst mit 5xx antwortet
 * (z. B. Datenbankfehler beim Speichern). Die 5xx-Meldung kommt zusätzlich von mitMonitoring.
 * Kontext nur mit technischen Werten füllen (Fehlercode, Hinweise), nie mit Eingaben.
 */
export async function meldeUrsache(route: string, fehler: unknown, kontext?: Kontext) {
  try {
    const nutzer = await gehashterNutzer();
    Sentry.withScope((scope) => {
      setzeScope(scope, route, 500, nutzer, kontext);
      Sentry.captureException(fehler instanceof Error ? fehler : new Error(String((fehler as { message?: unknown })?.message ?? fehler)));
    });
  } catch {
    // Überwachung darf die Antwort nie verhindern
  }
}

export async function melde5xx(route: string, status: number, fehler?: unknown) {
  try {
    const nutzer = await gehashterNutzer();
    if (fehler !== undefined) {
      Sentry.withScope((scope) => {
        setzeScope(scope, route, status, nutzer);
        Sentry.captureException(fehler);
      });
    }
    Sentry.withScope((scope) => {
      setzeScope(scope, route, status, nutzer);
      scope.setTag('typ', API_5XX_TAG);
      scope.setFingerprint([API_5XX_TAG, route]);
      scope.setLevel('error');
      Sentry.captureMessage(`${route} antwortet mit HTTP ${status}`);
    });
    // Serverless: vor dem Einfrieren der Funktion senden
    await Sentry.flush(2000);
  } catch {
    // Überwachung darf die Antwort nie verhindern
  }
}

/** Route-Handler umhüllen: `export const POST = mitMonitoring('POST /api/analysis', post);` */
export function mitMonitoring<A extends unknown[]>(route: string, handler: Handler<A>): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      const antwort = await handler(...args);
      if (antwort.status >= 500) await melde5xx(route, antwort.status);
      return antwort;
    } catch (fehler) {
      await melde5xx(route, 500, fehler);
      // Selbst antworten statt neu werfen: sonst meldet onRequestError denselben Fehler ein zweites Mal
      return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
  };
}
