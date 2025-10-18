// src/utils/wikiNearby.ts
// Geo-basierte Wikipedia-Snippets (de) rund um eine Koordinate (bis ~1,6 km).
// Neu: City-Filter/Scoring, damit wir in Köln bleiben (und kein "Komponistenviertel" woanders).

export type WikiNearbySnippet = { title: string; snippet: string; link: string };

type GeoSearchItem = { pageid: number; title: string; lat: number; lon: number; dist: number };
type GeoSearchResponse = { query?: { geosearch?: GeoSearchItem[] } };

type SummaryContentUrls = { desktop?: { page?: string } };
type SummaryResponse = { title?: string; extract?: string; content_urls?: SummaryContentUrls };

const UA = { 'User-Agent': 'ImmoInvest/1.0 (+contact@immoinvest.app)' };

async function geosearch(lat: number, lng: number, radius = 1600): Promise<GeoSearchItem[]> {
  const url = new URL('https://de.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'geosearch');
  url.searchParams.set('gscoord', `${lat}|${lng}`);
  url.searchParams.set('gsradius', String(radius));
  url.searchParams.set('gslimit', '50');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), { headers: UA, cache: 'no-store' });
  if (!res.ok) return [];
  const json = (await res.json()) as GeoSearchResponse;
  return json.query?.geosearch ?? [];
}

async function fetchSummaryByTitle(title: string): Promise<SummaryResponse | null> {
  const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: UA, cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as SummaryResponse;
}

function encCityMatch(link: string, city?: string) {
  if (!city) return false;
  const enc = encodeURIComponent(city);
  return link.toLowerCase().includes(encodeURIComponent(enc).toLowerCase()) || link.toLowerCase().includes(city.toLowerCase());
}

export async function wikiNearbySnippets(
  lat: number,
  lng: number,
  city?: string
): Promise<WikiNearbySnippet[]> {
  const pages = await geosearch(lat, lng, 1600);
  if (!pages.length) return [];

  const score = (t: string) => {
    const x = t.toLowerCase();
    let s = 0;
    if (/\b(friesenplatz|rudolfplatz|hauptbahnhof|bahnhof|hbf)\b/.test(x)) s += 6;
    if (/\b(viertel|veedel|stadtteil|neustadt|innenstadt|zentrum|ring|platz|markt)\b/.test(x)) s += 4;
    if (/\b(aachener straße|ringe)\b/.test(x)) s += 2;
    return s;
  };

  const ranked = pages
    .map(p => ({ p, s: score(p.title) }))
    .sort((a, b) => b.s - a.s || a.p.dist - b.p.dist)
    .slice(0, 30);

  const outRaw: Array<{ item: WikiNearbySnippet; cityHit: boolean; s: number }> = [];

  for (const { p, s } of ranked) {
    const sum = await fetchSummaryByTitle(p.title);
    const extract = (sum?.extract || '').trim();
    const link = sum?.content_urls?.desktop?.page || `https://de.wikipedia.org/wiki/${encodeURIComponent(p.title)}`;
    if (!extract || extract.length < 40) continue;

    const cityHit =
      !!city &&
      (extract.toLowerCase().includes(city.toLowerCase()) || encCityMatch(link, city));

    outRaw.push({
      item: { title: sum?.title || p.title, snippet: extract, link },
      cityHit,
      s,
    });
    if (outRaw.length >= 16) break;
  }

  // City-Treffer nach vorn priorisieren
  const withCity = outRaw.filter(x => x.cityHit);
  const without = outRaw.filter(x => !x.cityHit);

  const first = withCity.sort((a, b) => b.s - a.s).map(x => x.item);
  const rest = without.sort((a, b) => b.s - a.s).map(x => x.item);

  return [...first, ...rest].slice(0, 12);
}
