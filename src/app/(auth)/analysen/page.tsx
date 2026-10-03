'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { ArrowUpDown, Crown, Lock, Plus, Search, Trash2 } from 'lucide-react';
import { KontoSeite } from '@/components/konto/KontoSeite';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGespeicherteAnalysen } from '@/hooks/useGespeicherteAnalysen';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import { usePaywall } from '@/contexts/PaywallContext';
import { useImmoStore } from '@/store/useImmoStore';
import type { SavedAnalysis } from '@/lib/storage';

type Sortierung = 'zuletzt' | 'cashflow' | 'kaufpreis';

const fmt = (v: number, d = 0) => v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

function ampel(cf: number): { label: string; klasse: string } {
  if (cf > 10) return { label: 'Trägt sich', klasse: 'bg-emerald-50 text-emerald-700' };
  if (cf >= -10) return { label: 'Knapp', klasse: 'bg-amber-50 text-amber-700' };
  return { label: 'Zuzahlung', klasse: 'bg-red-50 text-red-700' };
}

function datum(a: SavedAnalysis) {
  const d = new Date(a.updatedAt || a.createdAt || Date.now());
  const heute = new Date();
  const tage = Math.floor((heute.getTime() - d.getTime()) / 86400000);
  if (tage <= 0 && d.getDate() === heute.getDate()) return 'heute';
  if (tage <= 1) return 'gestern';
  return d.toLocaleDateString('de-DE');
}

function NeueAnalyseKnopf({ klein = false }: { klein?: boolean }) {
  const router = useRouter();
  const resetAnalysis = useImmoStore(s => s.resetAnalysis);
  return (
    <button
      type="button"
      onClick={() => { resetAnalysis(); router.push('/input-method'); }}
      className={`inline-flex items-center gap-2 rounded-xl bg-[#ff6b00] font-bold text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-[#ff6b00]/90 ${klein ? 'px-4 py-2.5 text-sm' : 'px-5 py-3'}`}
    >
      <Plus size={17} strokeWidth={2.6} /> Neue Analyse
    </button>
  );
}

export default function MeineAnalysenPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const status = usePlanStatus();
  const { isPremium: paywallPremium } = usePaywall();
  const plan = { loaded: status.loaded, isPremium: status.isPremium || paywallPremium };
  const { analysen, laedt, loeschen } = useGespeicherteAnalysen(plan.loaded && plan.isPremium);
  const loadAnalysis = useImmoStore(s => s.loadAnalysis);
  const [suche, setSuche] = useState('');
  const [sortierung, setSortierung] = useState<Sortierung>('zuletzt');

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    const gefiltert = q
      ? analysen.filter(a => `${a.analysisName ?? ''} ${a.adresse ?? ''}`.toLowerCase().includes(q))
      : analysen;
    if (sortierung === 'cashflow') return [...gefiltert].sort((a, b) => (b.cashflow_operativ || 0) - (a.cashflow_operativ || 0));
    if (sortierung === 'kaufpreis') return [...gefiltert].sort((a, b) => (a.kaufpreis || 0) - (b.kaufpreis || 0));
    return gefiltert;
  }, [analysen, suche, sortierung]);

  const oeffnen = async (id: string) => {
    const ok = await loadAnalysis(id, userId);
    if (ok) router.push('/step/tabs');
    else toast.error('Die Analyse konnte nicht geladen werden');
  };

  const untertitel = plan.isPremium && analysen.length > 0
    ? `${analysen.length} ${analysen.length === 1 ? 'Wohnung' : 'Wohnungen'} gespeichert`
    : undefined;

  return (
    <KontoSeite
      titel="Meine Analysen"
      untertitel={untertitel}
      aktionen={plan.isPremium && analysen.length > 0 ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:w-64 sm:flex-none">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={suche}
              onChange={e => setSuche(e.target.value)}
              placeholder="Adresse suchen"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
              aria-label="Analysen durchsuchen"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select value={sortierung} onChange={e => setSortierung(e.target.value as Sortierung)} className="bg-transparent outline-none" aria-label="Sortierung">
              <option value="zuletzt">Zuletzt geändert</option>
              <option value="cashflow">Höchster Cashflow</option>
              <option value="kaufpreis">Niedrigster Kaufpreis</option>
            </select>
          </label>
        </div>
      ) : undefined}
    >
      {!plan.loaded ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : !plan.isPremium ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3e8]">
            <Lock size={22} className="text-[#ff6b00]" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#001d3d]">Analysen speichern mit Premium</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Mit Premium landet jede Wohnung hier, mit Ampel und Kennzahlen auf einen Blick. So kannst du mehrere Angebote vergleichen und später weiterrechnen.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/abo" className="inline-flex items-center gap-2 rounded-xl bg-[#001d3d] px-5 py-3 font-bold text-white hover:bg-[#001d3d]/90">
              <Crown size={17} /> Premium ansehen
            </Link>
            <NeueAnalyseKnopf />
          </div>
        </section>
      ) : laedt && analysen.length === 0 ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : analysen.length === 0 ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#001d3d]">Noch keine Analysen gespeichert</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Prüf deine erste Wohnung und speichere sie im Tab „Szenarien &amp; PDF Export“. Sie erscheint dann hier.
          </p>
          <div className="mt-6"><NeueAnalyseKnopf /></div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map(a => {
            const cf = Number(a.cashflow_operativ) || 0;
            const ton = ampel(cf);
            return (
              <article
                key={a.analysisId}
                className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                onClick={() => oeffnen(a.analysisId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#001d3d]">
                      {a.analysisName || a.adresse || 'Unbenannte Analyse'}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {[a.flaeche ? `${fmt(Number(a.flaeche))} m²` : null, a.kaufpreis ? `${fmt(Number(a.kaufpreis))} €` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${ton.klasse}`}>{ton.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div>
                    Cashflow
                    <b className={`block text-sm tabular-nums ${cf >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(cf)} €</b>
                  </div>
                  <div>
                    Nettorendite
                    <b className="block text-sm tabular-nums text-[#001d3d]">{fmt(Number(a.nettorendite) || 0, 1)} %</b>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{datum(a)}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); loeschen(a); }}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`${a.analysisName || a.adresse || 'Analyse'} löschen`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
          {!suche && (
            <button
              type="button"
              onClick={() => { useImmoStore.getState().resetAnalysis(); router.push('/input-method'); }}
              className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-500 transition hover:border-[#ff6b00] hover:text-[#001d3d]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b00] text-white"><Plus size={20} strokeWidth={2.6} /></span>
              <b className="text-[#001d3d]">Neue Analyse</b>
              Link, Foto oder manuell
            </button>
          )}
          {liste.length === 0 && suche && (
            <p className="col-span-full py-10 text-center text-sm text-slate-500">Keine Analyse passt zu „{suche}“.</p>
          )}
        </div>
      )}
    </KontoSeite>
  );
}
