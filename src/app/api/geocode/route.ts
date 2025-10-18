// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';

type MapboxFeature = { place_name: string };
type MapboxResponse = { features?: MapboxFeature[] };

type NominatimFeature = { properties: { display_name: string } };
type NominatimResponse = { features?: NominatimFeature[] };

type GeocodeFeature = { properties: { formatted: string } };
type GeocodeResult  = { features: GeocodeFeature[] };

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    if (!q || q.length < 2) return NextResponse.json({ features: [] } satisfies GeocodeResult);

    const MAPBOX = process.env.MAPBOX_API_TOKEN;
    if (!MAPBOX) {
      // Fallback: Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=geojson&limit=5&accept-language=de&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'immoinvest-mvp/1.0' } }
      );
      const data: NominatimResponse = await res.json();
      const features = (data.features ?? []).map(f => ({
        properties: { formatted: f.properties.display_name },
      }));
      return NextResponse.json({ features } satisfies GeocodeResult);
    }

    // Mapbox
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=5&language=de&access_token=${MAPBOX}`;
    const res = await fetch(url);
    const data: MapboxResponse = await res.json();
    const features = (data.features ?? []).map(f => ({
      properties: { formatted: f.place_name },
    }));

    return NextResponse.json({ features } satisfies GeocodeResult);
  } catch {
    return NextResponse.json({ features: [] } satisfies GeocodeResult, { status: 200 });
  }
}
