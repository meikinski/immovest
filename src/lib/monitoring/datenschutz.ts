/**
 * Datenschutz für die Fehlerüberwachung (Sentry): Bevor ein Ereignis den Browser oder Server verlässt,
 * werden personenbezogene Daten und Objektadressen entfernt. Nutzer erscheinen nur als Hash der Clerk-ID.
 *
 * Bewusst ohne Sentry-Import: reine Funktionen, die auch in Tests laufen.
 */

/** Typen nur so weit, wie wir sie anfassen (kompatibel zu Sentrys Event/Breadcrumb) */
type Obj = Record<string, unknown>;

export type MonitoringEvent = {
  message?: string;
  exception?: { values?: Array<{ value?: string; type?: string }> };
  request?: { url?: string; data?: unknown; cookies?: unknown; headers?: unknown; query_string?: unknown; env?: unknown };
  user?: { id?: string | number; [k: string]: unknown };
  extra?: Obj;
  contexts?: Record<string, Obj | undefined>;
  breadcrumbs?: MonitoringBreadcrumb[];
  tags?: Record<string, unknown>;
  transaction?: string;
  server_name?: string;
};

export type MonitoringBreadcrumb = {
  category?: string;
  message?: string;
  data?: Obj;
};

const STRASSEN_ENDUNG = '(?:straße|strasse|str\\.?|weg|allee|platz|gasse|ring|damm|ufer|chaussee|steig|pfad|markt|berg|hof|park|wall|graben|kamp|stieg|zeile)';

const MUSTER: Array<[RegExp, string]> = [
  // E-Mail-Adressen
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]'],
  // Clerk-IDs (user_…, sess_…), damit die Klar-ID nirgends auftaucht
  [/\b(?:user|sess|sia|idn)_[A-Za-z0-9]{10,}\b/g, '[clerk-id]'],
  // Straße mit Hausnummer: „Musterstraße 12a", „Am Ring 3", „Hauptstr. 7"
  [new RegExp(`[A-Za-zÄÖÜäöüß.\\-]*${STRASSEN_ENDUNG}\\s+\\d+\\s*[a-zA-Z]?(?![\\w])`, 'gi'), '[adresse]'],
  // „Straße" als eigenes Wort: „Kölner Straße 5", „Platz der Republik 1"
  [/\b(?:[A-ZÄÖÜ][a-zäöüß-]+\s+){1,3}\d{1,4}\s*[a-zA-Z]?(?=\s*,\s*\d{5})/g, '[adresse]'],
  // PLZ mit Ort: „10115 Berlin", „80331 München-Altstadt"
  [/\b\d{5}\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-]+(?:\s+(?:am|an der|im|in der|[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.\-]+))*/g, '[plz-ort]'],
  // Telefonnummern (deutsch, grob)
  [/(?:\+49|0049|\b0)[\s/-]?\d{2,5}[\s/-]?\d{3,}[\s/-]?\d{0,6}\b/g, '[telefon]'],
];

/** Query-Strings in URLs und Pfaden (z. B. ?adresse=…, auch URL-kodiert) */
const QUERY_IN_TEXT = /((?:https?:\/\/[^\s?#"']+)|(?:\/[\w\-.~%/[\]()]*))\?[^\s"'#]*/g;

/** Personenbezogenes und Adressen aus einem Text entfernen */
export function bereinigeText(text: string): string {
  let aus = text.replace(QUERY_IN_TEXT, '$1');
  for (const [muster, ersatz] of MUSTER) aus = aus.replace(muster, ersatz);
  return aus;
}

/** Felder, deren Inhalt nie übertragen wird (Name enthält einen dieser Begriffe) */
const GESPERRTE_SCHLUESSEL =
  /adress|address|strasse|straße|street|plz|zip|postal|city|stadt|e-?mail|telefon|phone|cookie|authorization|token|password|passwort|secret|vorname|nachname|firstname|lastname|fullname|username|^(?:ort|lage|ip|ip_address|lat|lng|lon|latitude|longitude|coords|q|query|body|data)$/i;

const MAX_TIEFE = 6;

const URL_SCHLUESSEL = /url|path|href|uri/i;

/** Objekt rekursiv bereinigen: gesperrte Schlüssel entfernen, Texte filtern */
export function bereinigeWert(wert: unknown, tiefe = 0): unknown {
  if (typeof wert === 'string') return bereinigeText(wert);
  if (tiefe >= MAX_TIEFE || wert === null || typeof wert !== 'object') return wert;
  if (Array.isArray(wert)) return wert.map((v) => bereinigeWert(v, tiefe + 1));
  const aus: Obj = {};
  for (const [k, v] of Object.entries(wert as Obj)) {
    if (GESPERRTE_SCHLUESSEL.test(k)) continue;
    // URLs und Pfade (z. B. contexts.nextjs.request_path) nur ohne Query
    aus[k] = typeof v === 'string' && URL_SCHLUESSEL.test(k) ? bereinigeUrl(v) : bereinigeWert(v, tiefe + 1);
  }
  return aus;
}

/** Nur Pfad behalten: Query (z. B. ?q=<Adresse>) und Fragment fallen weg */
export function bereinigeUrl(url: string): string {
  const ohne = url.split(/[?#]/)[0] ?? '';
  return bereinigeText(ohne);
}

/**
 * Ereignis vor dem Versand bereinigen (für beforeSend). Gibt dasselbe Objekt zurück.
 * - Request: nur Methode/Pfad, kein Body, keine Header, keine Cookies, keine Query
 * - Nutzer: nur die gehashte ID, keine IP, keine E-Mail
 * - Texte in Meldung, Exceptions, Extras, Kontexten und Breadcrumbs gefiltert
 */
export function bereinigeEvent<E extends MonitoringEvent>(event: E): E {
  if (event.message) event.message = bereinigeText(event.message);
  if (event.transaction) event.transaction = bereinigeUrl(event.transaction);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = bereinigeText(ex.value);
  }

  if (event.request) {
    const { url } = event.request;
    event.request = url ? { url: bereinigeUrl(url) } : {};
  }

  const hashId = event.user?.id;
  // Nur die gehashte ID behalten; ohne Hash (z. B. Gast) gar keinen Nutzer senden
  event.user = typeof hashId === 'string' && /^[0-9a-f]{16,64}$/.test(hashId) ? { id: hashId } : undefined;

  if (event.extra) event.extra = bereinigeWert(event.extra) as Obj;
  if (event.contexts) {
    const ctx: Record<string, Obj | undefined> = {};
    for (const [k, v] of Object.entries(event.contexts)) {
      // Geräte-, Browser-, Laufzeit-Kontexte sind unkritisch; alles andere wird gefiltert
      ctx[k] = bereinigeWert(v) as Obj | undefined;
    }
    event.contexts = ctx;
  }
  if (event.tags) event.tags = bereinigeWert(event.tags) as Record<string, unknown>;
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((b) => bereinigeBreadcrumb(b))
      .filter((b): b is MonitoringBreadcrumb => b !== null);
  }
  // Servername kann auf Vercel den Host verraten, ist für die Diagnose unnötig
  delete event.server_name;
  return event;
}

/**
 * Breadcrumbs bereinigen (für beforeBreadcrumb). Konsolen-Ausgaben fallen ganz weg:
 * Die App loggt dort teilweise Eingaben (Adressen, Nutzer-IDs).
 */
export function bereinigeBreadcrumb<B extends MonitoringBreadcrumb>(crumb: B): B | null {
  if (crumb.category === 'console') return null;
  if (crumb.message) crumb.message = bereinigeText(crumb.message);
  if (crumb.data) {
    const data: Obj = {};
    for (const [k, v] of Object.entries(crumb.data)) {
      if (k === 'url' || k === 'from' || k === 'to') {
        data[k] = typeof v === 'string' ? bereinigeUrl(v) : v;
      } else if (k === 'method' || k === 'status_code' || k === 'reason') {
        data[k] = v;
      }
      // alle anderen Daten (Bodies, Antwortgrößen, Eingabewerte) fallen weg
    }
    crumb.data = data;
  }
  return crumb;
}

/**
 * Clerk-ID pseudonymisieren: SHA-256 über Salz und ID, die ersten 16 Byte als Hex.
 * Läuft im Browser, in Node und in der Edge-Runtime (Web Crypto). Ohne Web Crypto: kein Nutzer.
 */
export async function hashNutzerId(userId: string, salz = process.env.NEXT_PUBLIC_MONITORING_HASH_SALT || 'imvestr-monitoring'): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle || !userId) return null;
    const bytes = new TextEncoder().encode(`${salz}:${userId}`);
    const digest = await subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}
