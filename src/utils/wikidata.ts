// src/utils/wikidata.ts
// Reverse-Geocoding via Wikidata SPARQL: liefert Viertel/Stadtteil nahe der Koordinate.

export type WikidataArea = {
  hoodLabel?: string;       // z. B. "Belgisches Viertel"
  districtLabel?: string;   // z. B. "Neustadt-Nord"
  cityLabel?: string;       // z. B. "Köln"
  wikiLinkDE?: string;      // https://de.wikipedia.org/wiki/…
};

const ENDPOINT = 'https://query.wikidata.org/sparql';

// SPARQL-JSON Typen
type SparqlValue = {
  type: string;
  value: string;
  'xml:lang'?: string;
  datatype?: string;
};
type SparqlBinding = Record<string, SparqlValue>;
type SparqlResponse = {
  head: { vars: string[] };
  results: { bindings: SparqlBinding[] };
};

export async function wikidataAreaByPoint(lat: number, lng: number): Promise<WikidataArea | null> {
  const q = `
SELECT ?item ?itemLabel ?article ?cityLabel ?districtLabel WHERE {
  SERVICE wikibase:around {
    ?item wdt:P625 ?loc .
    bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral ;
                     wikibase:radius "1.2" .
  }
  ?item wdt:P31 ?class .
  VALUES ?class { wd:Q123705 wd:Q11898138 wd:Q3032114 wd:Q15284 }  # neighbourhood, quarter, city district, borough
  OPTIONAL {
    ?item wdt:P131 ?parent .
    ?parent wdt:P31 ?pclass .
    FILTER (?pclass IN (wd:Q3032114, wd:Q15284))
    BIND(?parent AS ?district)
  }
  OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://de.wikipedia.org/> . }
  OPTIONAL { ?city wdt:P31 wd:Q515 . ?item wdt:P131* ?city . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
}
LIMIT 20`;

  const url = new URL(ENDPOINT);
  url.searchParams.set('query', q);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'ImmoInvest/1.0 (+contact@immoinvest.app)'
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const data = (await res.json()) as SparqlResponse;
  const rows: SparqlBinding[] = data.results?.bindings ?? [];
  if (!rows.length) return null;

  const val = (b: SparqlBinding, key: string) => b[key]?.value;
  const withDE = rows.find(r => (val(r, 'article') || '').startsWith('https://de.wikipedia.org/wiki/'));
  const r = withDE || rows[0];

  return {
    hoodLabel: val(r, 'itemLabel'),
    districtLabel: val(r, 'districtLabel'),
    cityLabel: val(r, 'cityLabel'),
    wikiLinkDE: val(r, 'article'),
  };
}
