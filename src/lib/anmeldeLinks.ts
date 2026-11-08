/**
 * Links auf /sign-up und /sign-in mit Herkunft (source) und Rücksprung (redirect_url).
 * Clerk liest redirect_url selbst aus der URL und leitet nach Registrierung/Anmeldung dorthin.
 */

export type SignUpQuelle =
  | 'hero_cta'
  | 'locked_preview'
  | 'result_banner'
  | 'paywall'
  | 'pricing'
  | 'save_analysis'
  | 'header'
  | 'sign_in_page'
  | 'direct';

/** Nur interne Pfade zulassen (kein Open Redirect über //host oder https://…) */
export function sichererPfad(ziel: string | null | undefined): string | null {
  if (!ziel || !ziel.startsWith('/') || ziel.startsWith('//') || ziel.startsWith('/\\')) return null;
  return ziel;
}

function mitParametern(basis: string, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${basis}?${s}` : basis;
}

export function signUpHref(source: SignUpQuelle, redirectUrl?: string | null) {
  return mitParametern('/sign-up', { source, redirect_url: sichererPfad(redirectUrl) });
}

export function signInHref(redirectUrl?: string | null) {
  return mitParametern('/sign-in', { redirect_url: sichererPfad(redirectUrl) });
}

/** Rücksprung führt zurück in eine eingegebene Wohnung (Ergebnis bzw. Eingabeschritte) */
export function fuehrtZurAnalyse(redirectUrl: string | null | undefined) {
  return !!sichererPfad(redirectUrl)?.startsWith('/step/');
}
