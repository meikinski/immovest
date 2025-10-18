// src/utils/compsSearch.ts
// Listing-Suche über Serper – robust mit City/Viertel-Scope und Objekttyp.

const SERPER_API_KEY = process.env.SERPER_API_KEY ?? '';

export type RawListing = {
  title: string;
  snippet: string;
  link: string;
};

type SerperOrganic = { title?: string; snippet?: string; link?: string };
type SerperResponse = { organic?: SerperOrganic[] };

function qForRent(city?: string, districtOrHood?: string, propertyType?: 'wohnung'|'haus') {
  const scope = [districtOrHood, city].filter(Boolean).join(' ');
  const typ = propertyType === 'haus' ? 'haus' : 'wohnung';
  const domains = 'site:immobilienscout24.de OR site:immowelt.de OR site:ebay-kleinanzeigen.de';
  return `${scope} miete ${typ} ${domains}`.trim();
}
function qForSale(city?: string, districtOrHood?: string, propertyType?: 'wohnung'|'haus') {
  const scope = [districtOrHood, city].filter(Boolean).join(' ');
  const typ = propertyType === 'haus' ? 'haus' : 'eigentumswohnung';
  const domains = 'site:immobilienscout24.de OR site:immowelt.de';
  return `${scope} kauf ${typ} ${domains}`.trim();
}

async function serperSearch(q: string, num = 20): Promise<RawListing[]> {
  if (!SERPER_API_KEY) return [];
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': SERPER_API_KEY },
    body: JSON.stringify({ q, gl: 'de', hl: 'de', num }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SerperResponse;
  return (data.organic ?? [])
    .map(o => ({ title: (o.title ?? '').trim(), snippet: (o.snippet ?? '').trim(), link: (o.link ?? '').trim() }))
    .filter(x => x.title && x.snippet && x.link);
}

export async function fetchRawRentComps(city?: string, areaHint?: string, propertyType?: 'wohnung'|'haus') {
  return serperSearch(qForRent(city, areaHint, propertyType), 20);
}
export async function fetchRawSaleComps(city?: string, areaHint?: string, propertyType?: 'wohnung'|'haus') {
  return serperSearch(qForSale(city, areaHint, propertyType), 20);
}
