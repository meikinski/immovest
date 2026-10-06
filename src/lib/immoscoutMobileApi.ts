/**
 * ImmoScout24 Mobile API client (inofficial, reverse engineered)
 *
 * The IS24 website sits behind AWS WAF and blocks server-side requests.
 * The endpoints used by the IS24 mobile app are currently not bot protected.
 * See https://github.com/orangecoding/fredy/blob/master/reverse-engineered-immoscout.md
 *
 * EXPERIMENTAL: endpoint, user agent and response schema can change at any time.
 */
import type { UrlScraperResult } from './urlScraperWorkflow';

const MOBILE_API_BASE = 'https://api.mobile.immobilienscout24.de';

// User agents used by the IS24 app (taken from Fredy's mobileApi.js)
const MOBILE_USER_AGENTS = ['ImmoScout_27.3_26.0_._', 'ImmoScout_28.1_26.5.2_._'];

/**
 * Checks whether a URL points to ImmobilienScout24 Germany
 */
export function isImmoscoutUrl(input: string): boolean {
  try {
    const hostname = new URL(input.trim()).hostname.toLowerCase();
    return hostname === 'immobilienscout24.de' || hostname.endsWith('.immobilienscout24.de');
  } catch {
    return false;
  }
}

/**
 * Extracts the numeric expose id from an IS24 listing URL
 * e.g. https://www.immobilienscout24.de/expose/169364993?referrer=...#/ → "169364993"
 */
export function extractImmoscoutExposeId(input: string): string | null {
  if (!isImmoscoutUrl(input)) return null;
  const match = new URL(input.trim()).pathname.match(/\/expose\/(\d{5,12})/);
  return match ? match[1] : null;
}

/**
 * Fetches a single expose via the mobile API, trying each known user agent.
 * Throws with a user-facing message if the listing cannot be loaded.
 */
export async function fetchImmoscoutExpose(exposeId: string): Promise<unknown> {
  let lastError = '';

  for (const userAgent of MOBILE_USER_AGENTS) {
    try {
      const response = await fetch(`${MOBILE_API_BASE}/expose/${exposeId}`, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      console.log(`[IS24 Mobile API] expose ${exposeId} (${userAgent}): HTTP ${response.status}`);

      if (response.status === 404) {
        throw new Error('Diese ImmoScout24-Anzeige ist nicht (mehr) online.\n\n💡 Lösung: Prüfe den Link oder gib die Daten manuell ein.');
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (response.ok && contentType.includes('json')) {
        return await response.json();
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      if ((error as Error).message.includes('nicht (mehr) online')) throw error;
      lastError = (error as Error).message;
      console.warn(`[IS24 Mobile API] expose ${exposeId} (${userAgent}) failed:`, lastError);
    }
  }

  throw new Error(`ImmoScout24 konnte gerade nicht abgerufen werden (${lastError}).\n\n💡 Lösung: Versuch es gleich nochmal oder gib die Daten manuell ein.`);
}

type Attribute = { label?: string; text?: string };
type Section = { type?: string; attributes?: Attribute[]; addressLine1?: string; addressLine2?: string; title?: string };
type ExposeResponse = {
  header?: { realEstateType?: string };
  sections?: Section[];
  adTargetingParameters?: Record<string, string>;
};

const NO_INFO = 'no_information';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß',
  eacute: 'é', egrave: 'è', aacute: 'á', agrave: 'à', ccedil: 'ç', euro: '€', sup2: '²',
};

/**
 * Decodes HTML entities returned by the API: "R&ouml;mergasse" → "Römergasse"
 */
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const num = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : entity;
    }
    return NAMED_ENTITIES[code] ?? entity;
  });
}

/**
 * Parses German formatted numbers: "1.374,50 €" → 1374.5, "111 m²" → 111, "3,57%" → 3.57
 */
function parseGermanNumber(text: string | undefined | null): number | null {
  if (!text) return null;
  const match = text.match(/-?\d[\d.]*(,\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

function parsePlainNumber(value: string | undefined): number | null {
  if (!value || value === NO_INFO) return null;
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Maps the mobile API expose response to the URL scraper result format
 */
export function mapImmoscoutExpose(raw: unknown): UrlScraperResult {
  const data = raw as ExposeResponse;
  const params = data.adTargetingParameters ?? {};
  const sections = data.sections ?? [];
  const warnings: string[] = [];

  // All "Label: Text" attributes, label without trailing colon
  const attributes = new Map<string, string>();
  for (const section of sections) {
    for (const attr of section.attributes ?? []) {
      if (attr.label && attr.text) {
        const label = decodeHtmlEntities(attr.label).replace(/:\s*$/, '').trim();
        if (!attributes.has(label)) attributes.set(label, decodeHtmlEntities(attr.text));
      }
    }
  }
  const findAttribute = (pattern: RegExp): string | undefined => {
    for (const [label, text] of attributes) {
      if (pattern.test(label)) return text;
    }
    return undefined;
  };

  // Objekttyp
  const realEstateType = (data.header?.realEstateType ?? '').toLowerCase();
  const haustyp = findAttribute(/^(Haustyp|Objektart|Objekttyp)$/i) ?? '';
  let objekttyp: UrlScraperResult['objekttyp'] = null;
  if (/mehrfamilien|zinshaus|wohn- und geschäftshaus/i.test(haustyp)) {
    objekttyp = 'mfh';
  } else if (realEstateType.startsWith('apartment')) {
    objekttyp = 'wohnung';
  } else if (realEstateType.startsWith('house')) {
    objekttyp = 'haus';
  }

  // Adresse: Straße nur wenn veröffentlicht, sonst PLZ + Stadtteil + Stadt
  const map = sections.find((s) => s.type === 'MAP');
  const street = params.obj_street && params.obj_street !== NO_INFO ? params.obj_street.replace(/_/g, ' ') : null;
  const houseNumber = params.obj_houseNumber && params.obj_houseNumber !== NO_INFO ? params.obj_houseNumber : null;
  const streetLine = street ? [street, houseNumber].filter(Boolean).join(' ') : null;
  const locationLine =
    map?.addressLine2 ||
    [params.obj_zipCode, params.obj_regio2].filter((v) => v && v !== NO_INFO).join(' ') ||
    null;
  const adresse = decodeHtmlEntities([streetLine, locationLine].filter(Boolean).join(', ')) || null;
  if (!streetLine && adresse) {
    warnings.push('ℹ️ Der Anbieter hat die genaue Adresse nicht veröffentlicht – übernommen wurden nur PLZ, Stadtteil und Stadt.');
  }

  // Maklergebühr
  const provisionText = findAttribute(/^Provision/i);
  let maklergebuehr: number | null = null;
  if (params.obj_courtage === 'n' || (provisionText && /provisionsfrei|keine/i.test(provisionText))) {
    maklergebuehr = 0;
  } else if (provisionText) {
    maklergebuehr = parseGermanNumber(provisionText);
  }

  // Hausgeld und Mieteinnahmen (nur vorhanden, wenn der Anbieter sie angibt)
  const hausgeld = parseGermanNumber(findAttribute(/^Hausgeld/i));
  const miete =
    parseGermanNumber(findAttribute(/^Mieteinnahmen/i)) ??
    (realEstateType.includes('rent') ? parseGermanNumber(findAttribute(/^Kaltmiete/i)) : null);

  if (objekttyp === 'wohnung' && hausgeld === null) {
    warnings.push('⚠️ In der Anzeige ist kein Hausgeld angegeben. Bitte beim Anbieter erfragen und manuell nachtragen.');
  }

  const wohneinheiten = parseGermanNumber(findAttribute(/Wohneinheiten/i));

  return {
    kaufpreis: parsePlainNumber(params.obj_purchasePrice) ?? parseGermanNumber(findAttribute(/^Kaufpreis$/i)),
    flaeche: parsePlainNumber(params.obj_livingSpace) ?? parseGermanNumber(findAttribute(/^Wohnfläche/i)),
    zimmer: parsePlainNumber(params.obj_noRooms) ?? parseGermanNumber(findAttribute(/^Zimmer$/i)),
    baujahr: parsePlainNumber(params.obj_yearConstructed) ?? parseGermanNumber(findAttribute(/^Baujahr$/i)),
    adresse,
    miete,
    hausgeld,
    hausgeld_umlegbar: null,
    hausgeld_nicht_umlegbar: null,
    maklergebuehr,
    objekttyp,
    anzahl_wohneinheiten: objekttyp === 'mfh' ? wohneinheiten : null,
    confidence: 'hoch',
    notes: 'Daten direkt von ImmoScout24 übernommen',
    warnings,
  };
}
