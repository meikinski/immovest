import * as Sentry from '@sentry/nextjs';
import { sentryBasisOptionen } from '@/lib/monitoring/sentryOptionen';

/** Fehlerüberwachung im Browser: unbehandelte Fehler und Promise-Rejections, ohne Session-Replay */
Sentry.init({
  ...sentryBasisOptionen(),
  ignoreErrors: [
    // Browser-Rauschen ohne Bezug zur App
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /^AbortError/,
  ],
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-(web-)?extension:\/\//],
});
