// src/utils/wikiSearch.ts
// Fallback: Textsuche auf Wikipedia + Summary.
// Neu: City-Filter/Prio, damit wir die richtige Stadt treffen.

export type WikiSnippet = { title: string; snippet: string; link: string };

type SearchHit = { title: string; snippet: string; pageid: number };
type SearchResponse = { query?: { search?: SearchHit[] } };

type SummaryContentUrls = { desktop?: { page?: string } };
type SummaryResponse = { title?: string; extract?: string; content_urls?: SummaryContentUrls };

const UA = { 'User-Agent': 'ImmoInvest/1.0 (+contact@immoinvest.app)' };

async function searchPages(q: string, limit = 20): Promise<SearchHit[]> {
  const url = new URL('https://de.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('srlimit', String(limit));
  const res = await fetch(url.toString(), { cache: 'no-store', headers: UA });
  if (!res.ok) return [];
  const data = (await res.json()) as SearchResponse;
  return data.query?.search ?? [];
}

async function fetchSummary(title: string): Promise<SummaryResponse | null> {
  const res = await fetch(
    `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { cache: 'no-store', headers: UA }
  );
  if (!res.ok) return null;
  return (await res.json()) as SummaryResponse;
}

export async function wikiSnippetsFor(
  ...terms: (string | undefined)[]
): Promise<WikiSnippet[]> {
  const q = terms.filter(Boolean).join(' ');
  if (!q) return [];
  const hits = await searchPages(q, 25);
  const out: WikiSnippet[] = [];

  for (const h of hits) {
    const s = await fetchSummary(h.title);
    const extract = (s?.extract || '').trim();
    const link = s?.content_urls?.desktop?.page || `https://de.wikipedia.org/wiki/${encodeURIComponent(h.title)}`;
    if (!extract || extract.length < 40) continue;
    out.push({ title: s?.title || h.title, snippet: extract, link });
    if (out.length >= 12) break;
  }
  return out;
}
