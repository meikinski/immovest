// src/utils/investCalc.ts
import type { ParsedComp } from './compsExtract';

export function euroPerSqmFromRent(c: ParsedComp): number | null {
  if (!c.cold_rent_eur || !c.size_sqm || c.size_sqm <= 5) return null;
  return c.cold_rent_eur / c.size_sqm;
}
export function euroPerSqmFromPrice(c: ParsedComp): number | null {
  if (!c.total_price_eur || !c.size_sqm || c.size_sqm <= 5) return null;
  return c.total_price_eur / c.size_sqm;
}

export function stats(values: number[]) {
  const v = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!v.length) return null;
  const q = (p: number) => {
    const idx = (p/100)*(v.length-1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return v[lo];
    return v[lo] + (v[hi]-v[lo])*(idx-lo);
  };
  return { count: v.length, median: q(50), p25: q(25), p75: q(75) };
}

export function summarizeRentComps(comps: ParsedComp[]) {
  const psqm = comps.map(euroPerSqmFromRent).filter((x): x is number => x !== null);
  const s = stats(psqm);
  const days = stats(comps.map(c => (c.days_online ?? NaN)).filter(Number.isFinite) as number[]);
  return { psqm: s, daysOnline: days, sample: comps.length };
}

export function summarizeSaleComps(comps: ParsedComp[]) {
  const psqm = comps.map(euroPerSqmFromPrice).filter((x): x is number => x !== null);
  const s = stats(psqm);
  return { psqm: s, sample: comps.length };
}

export function estimateGrossYield({
  livingArea, targetPrice, medianRentPsqm
}: { livingArea: number; targetPrice: number; medianRentPsqm: number | null }) {
  if (!livingArea || !targetPrice || !medianRentPsqm) return null;
  const annualRent = Math.round(livingArea * medianRentPsqm * 12);
  const gy = (annualRent / targetPrice) * 100;
  return { estAnnualRent: annualRent, grossYieldPct: Math.round(gy * 10) / 10 };
}
