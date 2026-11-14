'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/** Letzte Fehlergrenze (Fehler im Root-Layout): melden und eine schlichte Seite zeigen */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#001d3d', margin: 0 }}>
        <main style={{ maxWidth: 480, margin: '15vh auto', padding: '0 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24 }}>Etwas ist schiefgelaufen</h1>
          <p>Bitte lade die Seite neu. Wir wurden automatisch informiert.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, border: 0, background: '#ff6b00', color: '#fff', fontWeight: 700 }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
