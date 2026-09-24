'use client';

import React from 'react';
import {
  AlertTriangle, Calculator, ExternalLink, Flag, Lightbulb, MapPin, Users, type LucideIcon,
} from 'lucide-react';
import HtmlContent from '@/components/HtmlContent';

import type { MarketFacts } from '@/lib/marketFacts';

export type { MarketFacts };

type Tone = 'good' | 'neutral' | 'warn' | 'bad';

const TONE: Record<Tone, { badge: string; marker: string }> = {
  good: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', marker: 'bg-emerald-500' },
  neutral: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', marker: 'bg-[#001d3d]' },
  warn: { badge: 'bg-amber-50 text-amber-700 ring-amber-200', marker: 'bg-amber-500' },
  bad: { badge: 'bg-red-50 text-red-700 ring-red-200', marker: 'bg-red-500' },
};

const fmt = (n: number, fd: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: fd, maximumFractionDigits: fd });

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-7 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon: Icon, title, right }: { icon: LucideIcon; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-base font-bold text-[#001d3d]">
        <Icon size={18} className="text-[#ff6b00]" /> {title}
      </h3>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Miet- / Kaufpreis-Vergleich
// ---------------------------------------------------------------------------

function deltaInfo(kind: 'miete' | 'kauf', delta: number): { tone: Tone; label: string } {
  const abs = Math.round(Math.abs(delta));
  if (abs <= 5) return { tone: 'neutral', label: 'Marktüblich' };
  if (kind === 'miete') {
    // Miete über Markt = Risiko bei Neuvermietung, unter Markt = Potenzial
    if (delta > 0) return { tone: delta > 15 ? 'bad' : 'warn', label: `${abs} % über Markt` };
    return { tone: 'good', label: `${abs} % unter Markt` };
  }
  // Kaufpreis über Markt = teuer, unter Markt = günstig (aber prüfen)
  if (delta > 0) return { tone: delta > 10 ? 'bad' : 'warn', label: `${abs} % über Markt` };
  return { tone: 'good', label: `${abs} % unter Markt` };
}

function RangeBar({
  own, median, range, tone, fd, unit,
}: {
  own: number; median: number | null; range: { low: number; high: number } | null; tone: Tone; fd: number; unit: string;
}) {
  const values = [own, median, range?.low, range?.high].filter((v): v is number => typeof v === 'number' && v > 0);
  const min = Math.min(...values) * 0.85;
  const max = Math.max(...values) * 1.1;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;

  return (
    <div className="mt-6 mb-2">
      <div className="relative h-2 rounded-full bg-slate-100">
        {range && (
          <div
            className="absolute inset-y-0 rounded-full bg-slate-300"
            style={{ left: pos(range.low), width: `calc(${pos(range.high)} - ${pos(range.low)})` }}
          />
        )}
        {median != null && (
          <div className="absolute -top-1 h-4 w-0.5 bg-slate-500" style={{ left: pos(median) }} />
        )}
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${TONE[tone].marker}`}
          style={{ left: pos(own) }}
        />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>{range ? `Marktspanne ${fmt(range.low, fd)}–${fmt(range.high, fd)} ${unit}` : 'Markt-Median'}</span>
        <span className="flex items-center gap-3 whitespace-nowrap">
          <span className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${TONE[tone].marker}`} /> Dein Objekt</span>
          {median != null && <span className="flex items-center gap-1"><span className="h-2.5 w-0.5 bg-slate-500" /> Median</span>}
        </span>
      </div>
    </div>
  );
}

export function MarketCompareCard({
  kind, own, delta, facts, html,
}: {
  kind: 'miete' | 'kauf';
  own: number;                 // eigener Wert in €/m²
  delta: number | null;        // Abweichung in % vom Agent
  facts?: { median_psqm: number | null; range_psqm: { low: number; high: number } | null };
  html: string;
}) {
  const fd = kind === 'miete' ? 2 : 0;
  const unit = '€/m²';
  // Marktwert: aus Recherche, sonst aus der Abweichung zurückgerechnet
  const median =
    facts?.median_psqm ?? (delta != null && own > 0 ? own / (1 + delta / 100) : null);
  const effectiveDelta = delta ?? (median ? ((own - median) / median) * 100 : null);
  const info = effectiveDelta != null ? deltaInfo(kind, effectiveDelta) : null;
  const tone: Tone = info?.tone ?? 'neutral';

  return (
    <Card className="flex flex-col">
      <CardTitle
        icon={kind === 'miete' ? Users : Calculator}
        title={kind === 'miete' ? 'Mietpreis-Vergleich' : 'Kaufpreis-Vergleich'}
        right={info && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE[tone].badge}`}>{info.label}</span>
        )}
      />

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">{kind === 'miete' ? 'Deine Kaltmiete' : 'Dein Kaufpreis'}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#001d3d] tabular-nums">
            {own > 0 ? fmt(own, fd) : '–'} <span className="text-sm font-semibold text-slate-400">{unit}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Markt vor Ort</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-400 tabular-nums">
            {median != null ? fmt(median, fd) : '–'} <span className="text-sm font-semibold">{unit}</span>
          </p>
        </div>
      </div>

      {own > 0 && median != null && (
        <RangeBar own={own} median={median} range={facts?.range_psqm ?? null} tone={tone} fd={fd} unit={unit} />
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <HtmlContent className="text-sm leading-relaxed text-slate-600 [&>p]:!mb-3" html={html || '<p>–</p>'} />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lage & Umgebung
// ---------------------------------------------------------------------------

const VACANCY_TONE: Record<'niedrig' | 'mittel' | 'hoch', Tone> = { niedrig: 'good', mittel: 'warn', hoch: 'bad' };

export function LocationCard({ html, facts }: { html: string; facts?: MarketFacts | null }) {
  const district = facts?.location?.district;
  const plz = facts?.location?.postal_code;
  const drivers = facts?.demand?.drivers?.filter(Boolean) ?? [];
  const vacancy = facts?.vacancy?.risk;

  return (
    <Card>
      <CardTitle
        icon={MapPin}
        title="Lage & Umgebung"
        right={(district || plz) && (
          <span className="text-xs text-slate-500">{[plz, district].filter(Boolean).join(' · ')}</span>
        )}
      />
      <HtmlContent className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-700" html={html || '<p>–</p>'} />

      {(drivers.length > 0 || vacancy) && (
        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 md:flex-row md:items-start md:gap-10">
          {drivers.length > 0 && (
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-semibold text-slate-500">Nachfrage-Treiber</p>
              <div className="flex flex-wrap gap-2">
                {drivers.slice(0, 6).map((d, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{d}</span>
                ))}
              </div>
            </div>
          )}
          {vacancy && (
            <div className="shrink-0">
              <p className="mb-2 text-xs font-semibold text-slate-500">Leerstandsrisiko</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${TONE[VACANCY_TONE[vacancy]].badge}`}>
                {vacancy}
                {facts?.vacancy?.rate != null && ` · ${fmt(facts.vacancy.rate, 1)} %`}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quellen
// ---------------------------------------------------------------------------

export function SourcesCard({ citations }: { citations: NonNullable<MarketFacts['citations']> }) {
  const safe = citations.filter(c => /^https?:\/\//i.test(c.url)).slice(0, 6);
  if (safe.length === 0) return null;
  return (
    <Card>
      <h3 className="text-sm font-bold text-[#001d3d]">Quellen der Recherche</h3>
      <ul className="mt-4 space-y-3">
        {safe.map((c, i) => (
          <li key={i}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group flex items-start gap-2 text-sm"
            >
              <ExternalLink size={14} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-[#ff6b00]" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-700 group-hover:text-[#ff6b00]">{c.title}</span>
                <span className="block text-xs text-slate-400">{c.domain}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Investment-Empfehlung
// ---------------------------------------------------------------------------

type Section = { title: string; html: string };

/** Zerlegt das Agent-HTML (<h3>Titel</h3><p>…</p>…) in Abschnitte. */
function splitSections(html: string): Section[] {
  const parts = html.split(/<h3[^>]*>/i).slice(1);
  return parts.map(part => {
    const [rawTitle, ...rest] = part.split(/<\/h3>/i);
    const title = rawTitle
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .trim();
    return { title, html: rest.join('').trim() };
  });
}

function sectionIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes('zahlen')) return Calculator;
  if (t.includes('risik')) return AlertTriangle;
  if (t.includes('empfehlung')) return Lightbulb;
  return Flag;
}

export function InvestRecommendation({ html }: { html: string }) {
  const sections = splitSections(html || '');

  // Kein strukturiertes HTML (z. B. Fehlertext) → einfach anzeigen
  if (sections.length === 0) {
    return (
      <Card>
        <CardTitle icon={Lightbulb} title="Investment-Empfehlung" />
        <HtmlContent className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-700" html={html || '<p>–</p>'} />
      </Card>
    );
  }

  const fazit = sections.find(s => /fazit/i.test(s.title));
  const rest = sections.filter(s => s !== fazit);

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-6 md:p-7">
        <CardTitle icon={Lightbulb} title="Investment-Empfehlung" />
      </div>

      {fazit && (
        <div className="mx-6 md:mx-7 rounded-xl bg-[#001d3d] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff8c00]">Fazit</p>
          <HtmlContent className="mt-2 text-[15px] leading-relaxed text-white/90 [&>p]:!mb-2" html={fazit.html} />
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {rest.map((s, i) => {
          const Icon = sectionIcon(s.title);
          return (
            <section key={i} className="grid gap-3 p-6 md:grid-cols-[200px_1fr] md:gap-8 md:p-7">
              <h4 className="flex items-center gap-2 text-sm font-bold text-[#001d3d] md:items-start">
                <Icon size={16} className="shrink-0 text-[#ff6b00] md:mt-0.5" />
                {s.title}
              </h4>
              <HtmlContent className="max-w-3xl text-[15px] leading-relaxed text-slate-700" html={s.html} />
            </section>
          );
        })}
      </div>
    </Card>
  );
}
