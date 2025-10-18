import { NextRequest, NextResponse } from 'next/server';

type MarketStat = {
  p25: number;
  median: number;
  p75: number;
  count: number;
};

type Comparison = {
  subject: number | null;
  median: number;
  delta_pct: number;            // Abweichung in %
  verdict: 'unter Markt' | 'im Markt' | 'über Markt';
};

type YieldComparison = {
  currentPct: number | null;
  marketPct: number;
};

type Snapshot = {
  rent_psqm: MarketStat;
  sale_psqm: MarketStat;
  comparisons: {
    rent_psqm: Comparison;
    price_psqm: Comparison;
    yield_pct: YieldComparison;
  };
  demand_index: 'hoch' | 'mittel' | 'niedrig';
};

function hashInt(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function pctDelta(subject: number, median: number): number {
  if (median === 0) return 0;
  return Math.round(((subject - median) / median) * 100);
}

function verdictFromDelta(deltaPct: number): Comparison['verdict'] {
  if (deltaPct <= -7) return 'unter Markt';
  if (deltaPct >= 7) return 'über Markt';
  return 'im Markt';
}

function heuristicSnapshot(args: {
  address: string;
  livingArea: number;
  targetPrice: number;
  monthlyRent: number;
  rooms?: number;
  year?: number;
}): Snapshot {
  const { address, livingArea, targetPrice, monthlyRent, rooms, year } = args;
  const base = hashInt(address || 'de');

  // Basisspannen (DE-typisch)
  let rentMedian = 7 + (base % 8);           // 7–14 €/m²
  let saleMedian = 2300 + (base % 2500);     // 2300–4799 €/m²

  // leichte Modulation: größere Wohnungen eher niedriger €/m² Miete; modernes BJ -> höherer €/m² Kauf
  if (typeof rooms === 'number') {
    if (rooms >= 3) rentMedian -= 0.3; // Family-Flats
    if (rooms <= 1) rentMedian += 0.4; // 1-Zimmer teurer pro m²
  }
  if (typeof year === 'number') {
    if (year >= 2010) saleMedian += 180;
    else if (year <= 1975) saleMedian -= 120;
  }

  rentMedian = clamp(rentMedian, 6.5, 15);
  saleMedian = clamp(saleMedian, 1800, 5200);

  // Interquartile Range
  const rentP25 = rentMedian * 0.9;
  const rentP75 = rentMedian * 1.1;
  const saleP25 = saleMedian * 0.85;
  const saleP75 = saleMedian * 1.15;

  // Subjektwerte
  const subjectRent = livingArea > 0 ? monthlyRent / livingArea : null;
  const subjectPrice = livingArea > 0 ? targetPrice / livingArea : null;

  const rentComp: Comparison = {
    subject: subjectRent,
    median: rentMedian,
    delta_pct: subjectRent != null ? pctDelta(subjectRent, rentMedian) : 0,
    verdict: subjectRent != null ? verdictFromDelta(pctDelta(subjectRent, rentMedian)) : 'im Markt',
  };

  const priceComp: Comparison = {
    subject: subjectPrice,
    median: saleMedian,
    delta_pct: subjectPrice != null ? pctDelta(subjectPrice, saleMedian) : 0,
    verdict: subjectPrice != null ? verdictFromDelta(pctDelta(subjectPrice, saleMedian)) : 'im Markt',
  };

  const currentYield =
    targetPrice > 0 ? (monthlyRent * 12 * 100) / targetPrice : null;
  const marketYield = (rentMedian * 12 * 100) / saleMedian;

  // Nachfrage grob aus Hash + Preisniveau ableiten
  const demandBucket = (base % 100) / 100;
  let demand: Snapshot['demand_index'] =
    demandBucket > 0.66 ? 'hoch' : demandBucket > 0.33 ? 'mittel' : 'niedrig';

  // leichte Korrektur: sehr teuer + hohe Mieten → eher 'hoch'
  if (saleMedian >= 4000 && rentMedian >= 11) demand = 'hoch';
  if (saleMedian <= 2200 && rentMedian <= 8) demand = 'niedrig';

  return {
    rent_psqm: {
      p25: Number(rentP25.toFixed(2)),
      median: Number(rentMedian.toFixed(2)),
      p75: Number(rentP75.toFixed(2)),
      count: 80 + (base % 120), // 80–199 Stichprobe
    },
    sale_psqm: {
      p25: Math.round(saleP25),
      median: Math.round(saleMedian),
      p75: Math.round(saleP75),
      count: 60 + (base % 140), // 60–199 Stichprobe
    },
    comparisons: {
      rent_psqm: rentComp,
      price_psqm: priceComp,
      yield_pct: {
        currentPct: currentYield,
        marketPct: Number(marketYield.toFixed(1)),
      },
    },
    demand_index: demand,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
    address?: string;
    livingArea?: number;
    targetPrice?: number;
    monthlyRent?: number;
    propertyType?: string;
    rooms?: number;
    year?: number;
  };

    const address = body.address ?? '';
    const livingArea = Number(body.livingArea ?? 0);
    const targetPrice = Number(body.targetPrice ?? 0);
    const monthlyRent = Number(body.monthlyRent ?? 0);
    const rooms = typeof body.rooms === 'number' ? body.rooms : undefined;
    const year = typeof body.year === 'number' ? body.year : undefined;

    const snapshot = heuristicSnapshot({
      address,
      livingArea,
      targetPrice,
      monthlyRent,
      rooms,
      year,
    });

    return NextResponse.json({ snapshot });
  } catch (e) {
    console.error('invest route error', e);
    return NextResponse.json({ snapshot: null }, { status: 200 });
  }
}
