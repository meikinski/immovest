// src/utils/price.ts
import OpenAI from 'openai';

export type PriceComp = {
  titel?: string;
  quelle?: string;
  dist_km?: number;
  wohnfl: number;
  kaltmiete?: number;    // nur Miete
  kaufpreis?: number;    // nur Kauf
  eur_qm?: number;
};

export type PriceBasis = {
  adresse?: string;
  plz?: string;
  radius_km: number;
  ort?: string;
  kontext?: 'innerstädtisch'|'kleinstädtisch'|'dörflich';
};

export type PriceSummary = {
  basis: PriceBasis;
  metriken: { n: number; median_eur_qm: number; p25: number; p75: number };
  band: { min: number; max: number };
  text: string;
  comps: Array<{ titel?: string; dist_km?: number; wohnfl: number; wert: number; eur_qm: number; quelle?: string }>;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isPos(n: unknown): n is number { return typeof n === 'number' && Number.isFinite(n) && n > 0; }
function r2(x: number){ return Math.round(x*100)/100; }
function sorted(a: number[]){ return [...a].sort((x,y)=>x-y); }
function median(a: number[]){ const s=sorted(a), n=s.length; return n? (n%2? s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):NaN; }
function pct(a: number[], p: number){ const s=sorted(a), n=s.length; if(!n) return NaN; const i=(n-1)*p, lo=Math.floor(i), hi=Math.ceil(i), h=i-lo; return s[lo]+h*(s[hi]-s[lo]); }
function band(p25: number, p75: number){ return { min: r2(p25*0.98), max: r2(p75*1.02) }; }

function perQm(c: PriceComp, kind: 'rent'|'purchase'){
  if (isPos(c.eur_qm)) return c.eur_qm!;
  if (!isPos(c.wohnfl)) return null;
  if (kind==='rent' && isPos(c.kaltmiete)) return c.kaltmiete!/c.wohnfl;
  if (kind==='purchase' && isPos(c.kaufpreis)) return c.kaufpreis!/c.wohnfl;
  return null;
}

async function twoLines(kind:'rent'|'purchase', basis: PriceBasis, n:number, med:number, p25:number, p75:number, b:{min:number;max:number}) {
  const data = [
    `Art: ${kind==='rent'?'Miete':'Kauf'}`,
    `Ort: ${basis.ort||basis.plz||'–'}; Kontext: ${basis.kontext||'–'}`,
    `Radius: ${basis.radius_km} km`,
    `Beobachtungen: ${n}`,
    `Median: ${r2(med)} €/m²`,
    `P25–P75: ${r2(p25)}–${r2(p75)} €/m²`,
    `Empfehlung: ${r2(b.min)}–${r2(b.max)} €/m²`
  ].join('\n');

  const instr = `
Schreibe **max. 2 knappe Sätze**, sachlich:
1) „Im Umkreis von ${basis.radius_km} km liegen die aktuellen ${kind==='rent'?'Angebotsmieten':'Angebotspreise'} median bei ${r2(med)} €/m² (P25–P75: ${r2(p25)}–${r2(p75)}).${n<3?' (indikativ)':''}“
2) „Für das Objekt empfehlen wir ${r2(b.min)}–${r2(b.max)} €/m², abhängig von Zustand und Mikrolage.“
Nutze ausschließlich die Zahlen aus dem Datenblock. Keine weiteren Zahlen, keine Listen.
`.trim();

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.1,
    messages: [
      { role: 'system', content: 'Schreibe extrem knapp für Investor:innen. Nutze nur gegebene Zahlen.' },
      { role: 'user', content: `Daten:\n${data}\n\nAufgabe:\n${instr}` }
    ]
  });
  return res.choices[0].message?.content?.trim() || '';
}

export async function summarizeRent(basis: PriceBasis, comps: PriceComp[]): Promise<PriceSummary> {
  const vals = comps.map(c => ({ ...c, eur_qm: perQm(c,'rent')! })).filter(c => isPos(c.eur_qm) && isPos(c.wohnfl));
  const arr = vals.map(v => v.eur_qm as number);
  const n = arr.length, med=median(arr), p25=pct(arr,0.25), p75=pct(arr,0.75), b=band(p25,p75);
  const text = await twoLines('rent', basis, n, med, p25, p75, b);
  return {
    basis,
    metriken: { n, median_eur_qm: r2(med), p25: r2(p25), p75: r2(p75) },
    band: { min: r2(b.min), max: r2(b.max) },
    text,
    comps: vals.slice(0,8).map(v => ({ titel:v.titel, dist_km:v.dist_km, wohnfl:v.wohnfl, wert:v.kaltmiete??0, eur_qm:v.eur_qm as number, quelle:v.quelle }))
  };
}

export async function summarizePurchase(basis: PriceBasis, comps: PriceComp[]): Promise<PriceSummary> {
  const vals = comps.map(c => ({ ...c, eur_qm: perQm(c,'purchase')! })).filter(c => isPos(c.eur_qm) && isPos(c.wohnfl));
  const arr = vals.map(v => v.eur_qm as number);
  const n = arr.length, med=median(arr), p25=pct(arr,0.25), p75=pct(arr,0.75), b=band(p25,p75);
  const text = await twoLines('purchase', basis, n, med, p25, p75, b);
  return {
    basis,
    metriken: { n, median_eur_qm: r2(med), p25: r2(p25), p75: r2(p75) },
    band: { min: r2(b.min), max: r2(b.max) },
    text,
    comps: vals.slice(0,8).map(v => ({ titel:v.titel, dist_km:v.dist_km, wohnfl:v.wohnfl, wert:v.kaufpreis??0, eur_qm:v.eur_qm as number, quelle:v.quelle }))
  };
}
