/**
 * ImmoScout24 Mobile API client (inofficial, reverse engineered)
 *
 * The IS24 website sits behind AWS WAF and blocks server-side requests.
 * The endpoints used by the IS24 mobile app are currently not bot protected.
 * See https://github.com/orangecoding/fredy/blob/master/reverse-engineered-immoscout.md
 *
 * EXPERIMENTAL: endpoint and user agent can change at any time.
 */

const MOBILE_API_BASE = 'https://api.mobile.immobilienscout24.de';

// User agents used by the IS24 app (taken from Fredy's mobileApi.js)
const MOBILE_USER_AGENTS = ['ImmoScout_27.3_26.0_._', 'ImmoScout_28.1_26.5.2_._'];

export type ImmoscoutAttempt = {
  userAgent: string;
  status: number | null;
  durationMs: number;
  contentType: string | null;
  error?: string;
};

export type ImmoscoutExposeResult = {
  success: boolean;
  exposeId: string;
  attempts: ImmoscoutAttempt[];
  data?: unknown;
  error?: string;
};

/**
 * Extracts the numeric expose id from an IS24 listing URL
 * e.g. https://www.immobilienscout24.de/expose/169364993?referrer=...#/ → "169364993"
 */
export function extractImmoscoutExposeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{5,12}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (!url.hostname.endsWith('immobilienscout24.de')) return null;
    const match = url.pathname.match(/\/expose\/(\d{5,12})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Fetches a single expose via the mobile API, trying each known user agent
 */
export async function fetchImmoscoutExpose(exposeId: string): Promise<ImmoscoutExposeResult> {
  const attempts: ImmoscoutAttempt[] = [];

  for (const userAgent of MOBILE_USER_AGENTS) {
    const start = Date.now();
    try {
      const response = await fetch(`${MOBILE_API_BASE}/expose/${exposeId}`, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      const contentType = response.headers.get('content-type');
      attempts.push({
        userAgent,
        status: response.status,
        durationMs: Date.now() - start,
        contentType,
      });

      if (response.ok && contentType?.includes('json')) {
        return { success: true, exposeId, attempts, data: await response.json() };
      }

      // Listing removed – no point in retrying with another user agent
      if (response.status === 404) {
        return { success: false, exposeId, attempts, error: 'Anzeige nicht (mehr) verfügbar' };
      }
    } catch (error) {
      attempts.push({
        userAgent,
        status: null,
        durationMs: Date.now() - start,
        contentType: null,
        error: (error as Error).message,
      });
    }
  }

  return { success: false, exposeId, attempts, error: 'Alle Versuche fehlgeschlagen' };
}

/**
 * Collects all label/value pairs from the expose JSON.
 * The response schema is undocumented, so this walks the whole tree.
 */
export function collectLabeledValues(data: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;

    const obj = node as Record<string, unknown>;
    const label = obj.label ?? obj.title;
    const value = obj.text ?? obj.value;
    if (typeof label === 'string' && (typeof value === 'string' || typeof value === 'number')) {
      if (!(label in result)) result[label] = String(value);
    }
    Object.values(obj).forEach(walk);
  };

  walk(data);
  return result;
}
