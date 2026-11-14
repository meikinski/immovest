/**
 * Next-Server für Ende-zu-Ende-Tests starten: mit Clerk-Attrappe (Schlüssel aus clerkMock), ohne Sentry,
 * Supabase oder KI-Schlüssel. E2E_BASE_URL überspringt den Start (Server läuft schon mit passenden Variablen).
 * E2E_PROD=1 nutzt `next start` (vorher `npm run build` mit denselben Clerk-Variablen), sonst `next dev`.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { PUBLISHABLE_KEY, SECRET_KEY } from './clerkMock';

export type TestServer = { baseUrl: string; stop: () => void };

export function clerkServerEnv(jwtPublicPem: string): Record<string, string> {
  return {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: SECRET_KEY,
    // Sitzungs-Tokens offline prüfen (kein Abruf der JWKS bei Clerk)
    CLERK_JWT_KEY: jwtPublicPem,
    NEXT_TELEMETRY_DISABLED: '1',
    // Fehlerüberwachung im Test aus (oder auf einen lokalen Empfänger: E2E_SENTRY_DSN)
    NEXT_PUBLIC_SENTRY_DSN: process.env.E2E_SENTRY_DSN || '',
  };
}

export async function starteServer(jwtPublicPem: string): Promise<TestServer> {
  if (process.env.E2E_BASE_URL) return { baseUrl: process.env.E2E_BASE_URL, stop: () => {} };

  const port = Number(process.env.E2E_PORT || 3210);
  const root = path.join(__dirname, '..');
  const befehl = process.env.E2E_PROD ? ['start', '-p', String(port)] : ['dev', '-p', String(port)];
  const kind: ChildProcess = spawn('npx', ['next', ...befehl], {
    cwd: root,
    env: { ...process.env, ...clerkServerEnv(jwtPublicPem) },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let log = '';
  kind.stdout?.on('data', (d) => { log += d; if (process.env.E2E_SERVER_LOG) process.stdout.write(d); });
  kind.stderr?.on('data', (d) => { log += d; if (process.env.E2E_SERVER_LOG) process.stderr.write(d); });

  const baseUrl = `http://localhost:${port}`;
  const ende = Date.now() + 180_000;
  while (Date.now() < ende) {
    if (kind.exitCode !== null) throw new Error(`Next-Server beendet:\n${log}`);
    try {
      const res = await fetch(`${baseUrl}/impressum`);
      if (res.status < 500) break;
    } catch { /* startet noch */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return {
    baseUrl,
    stop: () => {
      try { if (kind.pid) process.kill(-kind.pid, 'SIGTERM'); } catch { /* schon beendet */ }
    },
  };
}
