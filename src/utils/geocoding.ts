// src/utils/geocoding.ts
// Schlankes Geocoding via Mapbox: liefert city/district/neighborhood + Koordinate.

export type GeocodeBasics = {
  lat: number;
  lng: number;
  city?: string;        // z. B. Köln
  district?: string;    // z. B. Neustadt-Nord / Neustadt
  neighborhood?: string; // z. B. Belgisches Viertel
};

type MapboxContext = { id: string; text: string };
type MapboxFeature = { center: [number, number]; context?: MapboxContext[]; text?: string };
type MapboxResponse = { features?: MapboxFeature[] };

export async function geocodeBasics(address: string): Promise<GeocodeBasics> {
  const token = process.env.MAPBOX_API_TOKEN;
  if (!token) throw new Error('MAPBOX_API_TOKEN fehlt');

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '1');
  url.searchParams.set('language', 'de');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Mapbox Fehler: ${res.status}`);
  const data = (await res.json()) as MapboxResponse;
  const f = data.features?.[0];
  if (!f) throw new Error('Adresse nicht gefunden');

  const [lng, lat] = f.center;
  let city: string | undefined;
  let district: string | undefined;
  let neighborhood: string | undefined;

  for (const c of f.context ?? []) {
    const id = c.id || '';
    if (id.startsWith('place')) city = city || c.text;
    if (id.includes('district') || id.includes('locality') || id.includes('place')) {
      district = district || c.text;
    }
    if (id.includes('neighborhood')) neighborhood = neighborhood || c.text;
  }

  return { lat, lng, city, district, neighborhood };
}
