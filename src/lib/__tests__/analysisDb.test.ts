/**
 * Tests für das Speichern und Laden von Analysen (POST /api/analysis → analyses-Tabelle → GET /api/analysis/[id]).
 *
 * Gespeichert wird der komplette Store-Zustand, wie ihn der aktuelle Ablauf erzeugt (exportState),
 * mit allen optionalen Feldern und Dezimalwerten. Die Datenbank ist ein kleiner Nachbau von
 * Supabase/PostgREST, der Spalten und Typen prüft und dieselben Fehlercodes liefert.
 *
 * Ausführen mit `npm test` oder `npx tsx src/lib/__tests__/analysisDb.test.ts`
 */

import assertNode from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildAnalysisRow, dedupeRows, rowToListItem, rowToState, saveAnalysisRow } from '../analysisDb';
import { useImmoStore } from '../../store/useImmoStore';
import type { MarketFacts } from '../marketFacts';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

// ---------------------------------------------------------------------------------------------
// Nachbau der Datenbank
// ---------------------------------------------------------------------------------------------

type Typ = 'text' | 'numeric' | 'integer' | 'jsonb';
type Spalte = { typ: Typ; notNull?: boolean; standard?: unknown };
type Zeile = Record<string, unknown>;
type Fehler = { code: string; message: string; details: string | null; hint: string | null };

const fehler = (code: string, message: string): Fehler => ({ code, message, details: null, hint: null });

/** Aktuelles Schema laut supabase-schema.sql (nach der Migration). */
const numerisch = [
  'kaufpreis', 'flaeche', 'zimmer', 'miete', 'hausgeld', 'hausgeld_umlegbar', 'ek', 'zins', 'tilgung',
  'grunderwerbsteuer_pct', 'notar_pct', 'makler_pct', 'mietausfall_pct', 'instandhaltungskosten_pro_qm', 'steuer',
  'afa', 'ruecklagen', 'persoenlicher_steuersatz', 'cashflow_operativ', 'nettorendite', 'score', 'anschaffungskosten',
];
const SCHEMA_AKTUELL: Record<string, Spalte> = {
  id: { typ: 'text' }, created_at: { typ: 'text' }, updated_at: { typ: 'text' },
  user_id: { typ: 'text', notNull: true },
  analysis_name: { typ: 'text', notNull: true },
  adresse: { typ: 'text', notNull: true, standard: '' },
  baujahr: { typ: 'integer', notNull: true, standard: 2024 },
  ...Object.fromEntries(numerisch.map(n => [n, { typ: 'numeric', notNull: true, standard: 0 } as Spalte])),
  ...Object.fromEntries(
    ['generated_comment', 'lage_comment', 'mietpreis_comment', 'qm_preis_comment', 'invest_comment']
      .map(n => [n, { typ: 'text', standard: '' } as Spalte])
  ),
  markt_facts: { typ: 'jsonb' }, client_id: { typ: 'text' }, state: { typ: 'jsonb' },
};

const ohne = (schema: Record<string, Spalte>, ...spalten: string[]) =>
  Object.fromEntries(Object.entries(schema).filter(([k]) => !spalten.includes(k)));
const alsGanzzahl = (schema: Record<string, Spalte>, ...spalten: string[]) =>
  Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, spalten.includes(k) ? { ...v, typ: 'integer' as Typ } : v]));

class FakeDb {
  zeilen: Zeile[] = [];
  versuche = 0;
  private uhr = Date.parse('2026-11-14T10:00:00Z');
  constructor(private schema: Record<string, Spalte>) {}

  private jetzt() { this.uhr += 1000; return new Date(this.uhr).toISOString(); }

  private pruefe(werte: Zeile, insert: boolean): Fehler | null {
    for (const k of Object.keys(werte)) {
      if (!this.schema[k]) return fehler('PGRST204', `Could not find the '${k}' column of 'analyses' in the schema cache`);
    }
    for (const [k, v] of Object.entries(werte)) {
      const s = this.schema[k];
      if (typeof v === 'string' && v.includes('\u0000')) return fehler('22P05', 'unsupported Unicode escape sequence');
      if (s.typ === 'jsonb' && JSON.stringify(v ?? null).includes('\\u0000')) return fehler('22P05', 'unsupported Unicode escape sequence');
      if (v === null || v === undefined) {
        if (s.notNull) return fehler('23502', `null value in column "${k}" of relation "analyses" violates not-null constraint`);
        continue;
      }
      if (s.typ === 'integer' && !(typeof v === 'number' && Number.isInteger(v))) {
        return fehler('22P02', `invalid input syntax for type integer: "${String(v)}"`);
      }
      if (s.typ === 'numeric' && !(typeof v === 'number' && Number.isFinite(v))) {
        return fehler('22P02', `invalid input syntax for type numeric: "${String(v)}"`);
      }
      if (s.typ === 'text' && typeof v !== 'string') return fehler('22P02', `invalid input for text: "${String(v)}"`);
    }
    if (insert) {
      for (const [k, s] of Object.entries(this.schema)) {
        if (s.notNull && s.standard === undefined && !(k in werte)) {
          return fehler('23502', `null value in column "${k}" of relation "analyses" violates not-null constraint`);
        }
      }
    }
    return null;
  }

  /** Wie JSONB/HTTP: nur JSON-fähige Werte überleben. */
  private kopie<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

  from(tabelle: string) {
    assertNode.equal(tabelle, 'analyses');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const db = this;
    const q = {
      art: 'select' as 'select' | 'insert' | 'update' | 'delete',
      werte: {} as Zeile,
      filter: [] as Array<[string, unknown]>,
      spalten: '*',
      sort: null as null | { spalte: string; ascending: boolean },
      max: Infinity,
      einzeln: false,
    };
    const run = (): { data: unknown; error: Fehler | null } => {
      for (const [k] of q.filter) {
        if (!db.schema[k]) return { data: null, error: fehler('42703', `column analyses.${k} does not exist`) };
      }
      const liste = q.spalten === '*' ? null : q.spalten.split(',').map(s => s.trim());
      for (const k of liste ?? []) {
        if (!db.schema[k]) return { data: null, error: fehler('42703', `column analyses.${k} does not exist`) };
      }
      const passt = (z: Zeile) => q.filter.every(([k, v]) => z[k] === v);
      let treffer: Zeile[];
      if (q.art === 'insert') {
        db.versuche++;
        const e = db.pruefe(q.werte, true);
        if (e) return { data: null, error: e };
        const zeit = db.jetzt();
        const neu: Zeile = { id: `00000000-0000-4000-8000-${String(db.zeilen.length + 1).padStart(12, '0')}`, created_at: zeit, updated_at: zeit };
        for (const [k, s] of Object.entries(db.schema)) if (!(k in neu)) neu[k] = s.standard ?? null;
        Object.assign(neu, db.kopie(q.werte));
        db.zeilen.push(neu);
        treffer = [neu];
      } else if (q.art === 'update') {
        db.versuche++;
        const e = db.pruefe(q.werte, false);
        if (e) return { data: null, error: e };
        treffer = db.zeilen.filter(passt);
        for (const z of treffer) Object.assign(z, db.kopie(q.werte), { updated_at: db.jetzt() });
      } else {
        treffer = db.zeilen.filter(passt);
      }
      if (q.sort) {
        const { spalte, ascending } = q.sort;
        treffer = [...treffer].sort((a, b) => String(a[spalte]).localeCompare(String(b[spalte])) * (ascending ? 1 : -1));
      }
      treffer = treffer.slice(0, q.max);
      const ausgabe = treffer.map(z => db.kopie(liste ? Object.fromEntries(liste.map(k => [k, z[k]])) : z));
      if (q.einzeln) {
        return ausgabe.length === 1
          ? { data: ausgabe[0], error: null }
          : { data: null, error: fehler('PGRST116', 'JSON object requested, multiple (or no) rows returned') };
      }
      return { data: ausgabe, error: null };
    };
    const kette = {
      insert(w: Zeile) { q.art = 'insert'; q.werte = w; return kette; },
      update(w: Zeile) { q.art = 'update'; q.werte = w; return kette; },
      select(s = '*') { q.spalten = s; return kette; },
      eq(k: string, v: unknown) { q.filter.push([k, v]); return kette; },
      order(spalte: string, o?: { ascending?: boolean }) { q.sort = { spalte, ascending: o?.ascending ?? true }; return kette; },
      limit(n: number) { q.max = n; return kette; },
      single() { q.einzeln = true; return kette; },
      then<T>(ok: (r: { data: unknown; error: Fehler | null }) => T) { return Promise.resolve(run()).then(ok); },
    };
    return kette;
  }

  get client() { return this as unknown as SupabaseClient; }
}

/** GET /api/analysis/[id]: Zeile laden und in Store-Daten umwandeln. */
async function lade(db: FakeDb, userId: string, clientId: string) {
  const { data } = await db.client.from('analyses').select('*').eq('user_id', userId).eq('client_id', clientId).single();
  return data ? rowToState(data as Zeile) : null;
}

// ---------------------------------------------------------------------------------------------
// Kompletter Zustand aus dem aktuellen Ablauf: Leipzig, Prager Straße 123 (URL-Import, EK 0)
// ---------------------------------------------------------------------------------------------

const marktFacts = {
  location: { postal_code: '04317', district: 'Reudnitz-Thonberg', confidence: 'hoch', notes: 'Gründerzeitviertel' },
  rent: { median_psqm: 8.47, range_psqm: { low: 6.9, high: 10.25 }, notes: 'Bestand, 60–90 m²' },
  price: { median_psqm: 2810.46, range_psqm: { low: 2100, high: 3650.5 }, notes: 'Altbau' },
  vacancy: { risk: 'niedrig', rate: 2.3, notes: null },
  demand: { drivers: ['Uniklinikum', 'S-Bahn „Stötteritz“'], notes: 'Zuzug +1,2 % p. a.' },
  citations: [{ title: 'Mietspiegel Leipzig 2025', url: 'https://example.org/mietspiegel?a=1&b=2', domain: 'example.org' }],
} as unknown as MarketFacts;

function vollerZustand(): Record<string, unknown> {
  const store = useImmoStore.getState();
  store.resetAnalysis();
  store.importData({
    analysisId: 'analysis_1763114400000_k3x9a',
    analysisName: '',
    createdAt: '2026-11-14T10:00:00.000Z',
    kaufpreis: 215000,
    objekttyp: 'wohnung',
    grunderwerbsteuer_pct: 5.5,
    notar_pct: 2,
    makler_pct: 3.57,
    sonstige_kosten: 1250.5,
    flaeche: 76.5,
    adresse: 'Prager Straße 123, 04317 Leipzig',
    zimmer: 2.5,
    baujahr: 1900,
    miete: 468.33,
    hausgeld: 251.17,
    hausgeld_umlegbar: 163.26,
    mietausfall_pct: 2.5,
    anzahl_wohneinheiten: 0,
    verwaltungskosten: 0,
    instandhaltungskosten_pro_qm: 11.75,
    steuer: 0,
    ruecklagen: 0,
    persoenlicher_steuersatz: 42,
    ek: 0,
    zins: 3.85,
    tilgung: 1.5,
    anschaffungskosten: 238801.05,
    generatedComment: 'Cashflow −612,40 € im Monat.\nDie Miete liegt 27,7 % unter dem Markt.',
    lageComment: 'Reudnitz-Thonberg: „solide“ Lage, 10 Min. zum Zentrum.',
    mietpreisComment: '6,12 €/m² gegenüber 8,47 €/m² im Viertel.',
    qmPreisComment: '2.810,46 €/m² – im Mittel.',
    investComment: 'Nur mit Mieterhöhung tragfähig. <b>Kein</b> Selbstläufer & viel Aufwand.',
    marktFacts,
    mietMarktDelta: -27.72,
    kaufMarktDelta: 0.0041,
    afaModell: 'linear_2',
    nutzeSonderAfa: false,
    grundstueckswert: 43000.75,
  });
  return useImmoStore.getState().exportState();
}

/** Felder, die der aktuelle Ablauf speichern muss (Kandidaten aus dem Fehlerbericht eingeschlossen). */
const ERWARTETE_FELDER = [
  'analysisId', 'analysisName', 'createdAt', 'updatedAt', 'kaufpreis', 'objekttyp', 'grunderwerbsteuer_pct', 'notar_pct',
  'makler_pct', 'sonstige_kosten', 'flaeche', 'adresse', 'zimmer', 'baujahr', 'miete', 'hausgeld', 'hausgeld_umlegbar',
  'mietausfall_pct', 'anzahl_wohneinheiten', 'verwaltungskosten', 'instandhaltungskosten_pro_qm', 'steuer', 'afa',
  'ruecklagen', 'persoenlicher_steuersatz', 'ek', 'zins', 'tilgung', 'cashflow_operativ', 'nettorendite', 'score',
  'anschaffungskosten', 'generatedComment', 'lageComment', 'mietpreisComment', 'qmPreisComment', 'investComment',
  'marktFacts', 'mietMarktDelta', 'kaufMarktDelta', 'afaModell', 'nutzeSonderAfa', 'grundstueckswert',
];

const USER = 'user_2abcPremium';

async function main() {
  // console.error/warn des Speicherpfads gehören zum Test (Fallbacks) – Ausgabe hier unterdrücken
  const logs: unknown[][] = [];
  console.error = (...a: unknown[]) => { logs.push(a); };
  console.warn = (...a: unknown[]) => { logs.push(a); };
  const originalLog = console.log;
  console.log = (...a: unknown[]) => { if (typeof a[0] === 'string' && a[0].startsWith('updateDerived')) return; originalLog(...a); };

  const zustand = vollerZustand();
  // So kommt der Zustand im Handler an: einmal durch JSON (fetch-Body)
  const payload = JSON.parse(JSON.stringify(zustand)) as Record<string, unknown>;

  console.log('\nKompletter Zustand aus dem aktuellen Ablauf');
  for (const feld of ERWARTETE_FELDER) {
    if (!(feld in zustand)) throw new Error(`FAILED: exportState enthält das Feld ${feld} nicht`);
  }
  assert(true, `exportState enthält alle ${ERWARTETE_FELDER.length} erwarteten Felder`);
  assert(payload.flaeche === 76.5 && payload.miete === 468.33 && payload.zimmer === 2.5, 'Dezimalwerte im Payload (76.5 m², 468.33 €, 2.5 Zimmer)');
  assert(payload.ek === 0 && payload.baujahr === 1900 && payload.afa === 2.5, 'Eigenkapital 0, Baujahr 1900, AfA 2,5 %');
  assert(typeof payload.cashflow_operativ === 'number' && !Number.isInteger(payload.cashflow_operativ), 'berechneter Cashflow ist ein Dezimalwert');

  console.log('\nAktuelles Schema: speichern und wieder laden');
  {
    const db = new FakeDb(SCHEMA_AKTUELL);
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(r.ok && r.hinweise.length === 0 && db.versuche === 1, 'Speichern gelingt im ersten Versuch, ohne Fallback');
    assert(r.clientId === payload.analysisId, 'die Client-ID bleibt die analysisId aus dem Store');
    const geladen = await lade(db, USER, r.clientId);
    assertNode.deepEqual(geladen, payload);
    assert(true, 'der geladene Zustand ist identisch mit dem gespeicherten (alle Felder, alle Dezimalwerte)');

    const zeile = db.zeilen[0];
    assert(zeile.flaeche === 76.5 && zeile.miete === 468.33 && zeile.zimmer === 2.5 && zeile.kaufpreis === 215000, 'Spalten für Liste und Sortierung tragen die exakten Werte');
    assert(zeile.analysis_name === 'Prager Straße 123, 04317 Leipzig', 'Name fällt auf die Adresse zurück');
    const liste = dedupeRows(db.zeilen).map(rowToListItem);
    assert(liste.length === 1 && liste[0].analysisId === r.clientId && liste[0].flaeche === 76.5 && !liste[0].legacy, 'Analyse erscheint in „Meine Analysen“');

    // In den Store laden und erneut exportieren: nichts geht verloren
    const store = useImmoStore.getState();
    store.resetAnalysis();
    store.importData(geladen as Parameters<typeof store.importData>[0]);
    const wieder = JSON.parse(JSON.stringify(useImmoStore.getState().exportState())) as Record<string, unknown>;
    assertNode.deepEqual({ ...wieder, updatedAt: null }, { ...payload, updatedAt: null });
    assert(true, 'nach dem Öffnen steht im Store wieder derselbe Zustand (inkl. sonstige Kosten, AfA-Modell, Grundstückswert, Marktdaten)');

    // Erneut speichern aktualisiert dieselbe Zeile
    const r2 = await saveAnalysisRow(db.client, USER, { ...payload, miete: 512.5, investComment: 'Neu bewertet.' });
    assert(r2.ok && db.zeilen.length === 1 && r2.ok && r.ok && r2.dbId === r.dbId, 'erneutes Speichern aktualisiert die Zeile statt eine zweite anzulegen');
    const geladen2 = await lade(db, USER, r.clientId);
    assert(geladen2?.miete === 512.5 && geladen2?.investComment === 'Neu bewertet.', 'der neue Stand wird geladen');

    // Andere Person mit derselben Client-ID: eigene Zeile, fremde bleibt unberührt
    const r3 = await saveAnalysisRow(db.client, 'user_anderer', payload);
    assert(r3.ok && db.zeilen.length === 2 && (await lade(db, USER, r.clientId))?.miete === 512.5, 'Analysen verschiedener Konten bleiben getrennt');
  }

  console.log('\nKünftige Änderungen am Store');
  {
    const db = new FakeDb(SCHEMA_AKTUELL);
    const zukunft = { ...payload, neuesFeld2027: { tiefe: [1.5, 'zwei', null, true] }, energieklasse: 'C', sanierungsBudget: 12500.99 };
    const r = await saveAnalysisRow(db.client, USER, zukunft);
    assert(r.ok && db.versuche === 1, 'unbekannte neue Felder lassen das Speichern nicht scheitern');
    assertNode.deepEqual(await lade(db, USER, r.clientId), zukunft);
    assert(true, 'neue Felder werden ohne Schema-Änderung mitgespeichert und wieder geladen');
  }

  console.log('\nUnsaubere Werte');
  {
    const db = new FakeDb(SCHEMA_AKTUELL);
    const schmutzig = {
      ...payload, analysisId: undefined, kaufpreis: '215000', flaeche: '76,5', miete: null, zimmer: '', score: 'NaN',
      nettorendite: null, baujahr: '1900', generatedComment: null, lageComment: 'Lage\u0000 gut',
      marktFacts: { ...marktFacts, demand: { drivers: ['A\u0000B'], notes: null } }, analysisName: '   ',
    };
    const r = await saveAnalysisRow(db.client, USER, JSON.parse(JSON.stringify(schmutzig)));
    assert(r.ok && db.versuche === 1, 'Strings statt Zahlen, null, NaN und Null-Bytes führen nicht zu einem Datenbankfehler');
    const z = db.zeilen[0];
    assert(z.kaufpreis === 215000 && z.flaeche === 76.5 && z.miete === 0 && z.zimmer === 0 && z.score === 0 && z.baujahr === 1900, 'Zahlen werden sauber umgewandelt');
    assert(z.lage_comment === 'Lage gut' && z.generated_comment === '', 'Texte werden bereinigt');
    assert(r.ok && /^analysis_\d+_/.test(r.clientId) && z.client_id === r.clientId, 'ohne analysisId wird eine vergeben');
    assert(buildAnalysisRow(USER, {}).row.analysis_name === 'Unbenannt', 'leerer Payload ergibt eine gültige Zeile');
  }

  console.log('\nLive-Tabelle ohne Migration (client_id, state, markt_facts fehlen)');
  {
    const db = new FakeDb(ohne(SCHEMA_AKTUELL, 'client_id', 'state', 'markt_facts'));
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(r.ok && db.zeilen.length === 1, 'Speichern gelingt trotzdem');
    assert(r.ok && r.hinweise.length === 3, 'die fehlenden Spalten werden als Hinweis gemeldet');
    const z = db.zeilen[0];
    assert(z.flaeche === 76.5 && z.miete === 468.33 && z.lage_comment === payload.lageComment, 'Eckdaten und Kommentare stehen in den Spalten');
    const alt = rowToState(z);
    assert(alt.kaufpreis === 215000 && alt.flaeche === 76.5 && alt.ek === 0 && alt.investComment === payload.investComment, 'die Analyse lässt sich aus den Spalten wieder öffnen');
  }

  console.log('\nLive-Tabelle mit weiteren fehlenden Spalten');
  {
    const db = new FakeDb(ohne(SCHEMA_AKTUELL, 'hausgeld_umlegbar', 'qm_preis_comment', 'anschaffungskosten'));
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(r.ok, 'Speichern gelingt ohne die fehlenden Spalten');
    assertNode.deepEqual(await lade(db, USER, r.clientId), payload);
    assert(true, 'der Zustand kommt über state trotzdem vollständig zurück');
  }

  console.log('\nLive-Tabelle mit Ganzzahl-Spalten (Dezimalwerte 76.5 und 468.33)');
  {
    const db = new FakeDb(alsGanzzahl(SCHEMA_AKTUELL, 'flaeche', 'miete', 'zimmer', 'hausgeld'));
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(r.ok, 'Speichern gelingt');
    const z = db.zeilen[0];
    assert(z.flaeche === 77 && z.miete === 468 && z.zimmer === 3, 'nur die Ganzzahl-Spalten werden gerundet');
    assert(z.zins === 3.85 && z.instandhaltungskosten_pro_qm === 11.75 && z.cashflow_operativ === payload.cashflow_operativ, 'NUMERIC-Spalten behalten ihre Dezimalwerte');
    assertNode.deepEqual(await lade(db, USER, r.clientId), payload);
    assert(true, 'geladen werden die exakten Werte aus state');
  }
  {
    const db = new FakeDb(ohne(alsGanzzahl(SCHEMA_AKTUELL, 'flaeche'), 'state'));
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(!r.ok && db.zeilen.length === 0, 'ohne state wird nicht still gerundet: Speichern schlägt fehl');
    assert(!r.ok && r.error?.code === '22P02', 'der echte Datenbankfehler wird zurückgegeben');
    const geloggt = logs.some(l => JSON.stringify(l).includes('invalid input syntax for type integer'));
    assert(geloggt, 'und mit Meldung im Server-Log protokolliert');
  }

  console.log('\nPflichtspalte ohne Standardwert, die die App nicht kennt');
  {
    const db = new FakeDb({ ...SCHEMA_AKTUELL, alte_spalte: { typ: 'text', notNull: true } });
    const r = await saveAnalysisRow(db.client, USER, payload);
    assert(!r.ok && r.error?.code === '23502' && db.versuche === 1, 'schlägt sofort fehl (kein endloses Wiederholen), Fehler mit Spaltenname im Log');
  }

  console.log = originalLog;
  console.log('\n✅ Alle Tests bestanden');
}

main().catch(e => { process.stderr.write(`${e?.stack ?? e}\n`); process.exit(1); });
