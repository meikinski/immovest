/**
 * Prüft den Authorization-Header eines Vercel-Cron-Aufrufs ("Bearer <CRON_SECRET>").
 * Ohne gesetztes Secret immer false, damit die Route nicht öffentlich aufrufbar ist.
 * Vergleich in konstanter Zeit (Edge- und Node-tauglich, ohne node:crypto).
 */
export function cronAutorisiert(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const erwartet = `Bearer ${secret}`;
  if (header.length !== erwartet.length) return false;
  let diff = 0;
  for (let i = 0; i < erwartet.length; i++) diff |= header.charCodeAt(i) ^ erwartet.charCodeAt(i);
  return diff === 0;
}
