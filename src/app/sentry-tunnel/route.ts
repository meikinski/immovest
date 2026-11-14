// Ziel des Sentry-Tunnels (/monitoring, siehe next.config.ts): leitet nur die Fehlerberichte an Sentry weiter,
// ohne Cookies und Header der Besucher. Nimmt nur Berichte für die eigene DSN an.
export { POST } from '@sentry/nextjs/tunnel';
