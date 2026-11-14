/**
 * Tests für den Kostenschutz der KI-Routen:
 *  - /api/agent/run verlangt Anmeldung und prüft den Plan auf dem Server
 *  - Gratis-Kontingent: zweite Wohnung → 402, gleiche Analyse zählt nicht doppelt, parallele Läufe zählen einmal
 *  - Rate Limit → 429, globales KI-Tagesbudget → 503
 *
 * Clerk, Supabase und OpenAI sind durch kleine Nachbauten ersetzt.
 * Ausführen mit `npm test` oder `npx tsx src/lib/__tests__/kostenSchutz.test.ts`
 */

import { agentRunPost, type AgentRunDeps } from '../agentRun';
import { kiSchutz, type ZaehlerStore, type SchutzDeps } from '../kostenSchutz';
import { normalisiereAdresse, type GratisEintrag, type PlanStore, type PlanZeile } from '../gratisAnalyse';
import { cronAutorisiert } from '../cronAuth';
import { RATE_LIMITS } from '../../config/limits';
import { GRATIS_ANALYSEN } from '../../config/pricing';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

// ---------------------------------------------------------------------------------------------
// Nachbauten
// ---------------------------------------------------------------------------------------------

class FakeZaehler implements ZaehlerStore {
  werte = new Map<string, number>();
  async hit(key: string, _fenster: number, kosten = 1) {
    const neu = (this.werte.get(key) ?? 0) + kosten;
    this.werte.set(key, neu);
    return neu;
  }
}

/** user_premium_usage mit Compare-and-Swap auf usage_count wie das PostgREST-Update mit .eq('usage_count') */
class FakePlanStore implements PlanStore {
  zeilen = new Map<string, PlanZeile>();
  async lese(userId: string) {
    const z = this.zeilen.get(userId);
    return z ? structuredClone(z) : null;
  }
  async legeAn(userId: string) {
    if (!this.zeilen.has(userId)) {
      this.zeilen.set(userId, { is_premium: false, premium_until: null, usage_count: 0, free_analyses: [] });
    }
  }
  async verbuche(userId: string, erwartet: number, neu: { usage_count: number; free_analyses: GratisEintrag[] }) {
    const z = this.zeilen.get(userId);
    if (!z || (z.usage_count ?? 0) !== erwartet) return false;
    this.zeilen.set(userId, { ...z, ...structuredClone(neu) });
    return true;
  }
}

const ADRESSE_A = 'Musterstraße 1, 04109 Leipzig';
const ADRESSE_B = 'Beispielweg 7, 50677 Köln';

function body(adresse: string, analysisId: string | null = 'analysis_1') {
  return {
    analysisId,
    address: adresse,
    objektTyp: 'Eigentumswohnung',
    kaufpreis: 250000, flaeche: 70, zimmer: 3, baujahr: 1995,
    miete: 900, hausgeld: 250, hausgeld_umlegbar: 150, ek: 50000, zins: 3.5, tilgung: 2,
  };
}

function anfrage(b: unknown, ip = '203.0.113.7') {
  return new Request('https://example.test/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(b),
  });
}

function deps(opts: { userId: string | null; plan?: FakePlanStore; zaehler?: FakeZaehler; env?: Record<string, string>; lauf?: () => Promise<unknown> }) {
  const aufrufe = { workflow: 0 };
  const d: AgentRunDeps = {
    getUserId: async () => opts.userId,
    zaehler: opts.zaehler ?? new FakeZaehler(),
    env: { NODE_ENV: 'production', ...(opts.env ?? {}) },
    planStore: opts.plan ?? new FakePlanStore(),
    runWorkflow: async () => {
      aufrufe.workflow++;
      if (opts.lauf) return opts.lauf();
      return { analyse: { lage: { html: '<p>ok</p>' } }, invest: { html: '<p>ok</p>' } };
    },
    geocodeBasics: async () => ({ city: 'Leipzig' }),
    wikidataAreaByPoint: async () => null,
  };
  return { d, aufrufe };
}

async function main() {
  // Logs der Route stummschalten, Testausgaben bleiben sichtbar
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const fehlerLogs: string[] = [];
  console.warn = () => {};
  console.error = (...a: unknown[]) => { fehlerLogs.push(a.map(String).join(' ')); };
  const log = (...a: unknown[]) => originalLog(...a);
  console.log = (...a: unknown[]) => { if (typeof a[0] === 'string' && a[0].startsWith('✓')) originalLog(...a); };

  log('\n/api/agent/run: Anmeldung');
  {
    const { d, aufrufe } = deps({ userId: null });
    const res = await agentRunPost(anfrage(body(ADRESSE_A)), d);
    const json = await res.json();
    assert(res.status === 401, 'abgemeldeter Aufruf wird mit 401 abgewiesen');
    assert(aufrufe.workflow === 0, 'ohne Anmeldung läuft keine KI');
    assert(typeof json.message === 'string' && json.message.includes('melde dich an'), 'mit deutscher Meldung');
  }

  log('\n/api/agent/run: Gratis-Kontingent');
  assert(GRATIS_ANALYSEN === 1, `Gratis-Kontingent ist ${GRATIS_ANALYSEN} (Tests gehen von 1 aus)`);
  {
    const plan = new FakePlanStore();
    const { d, aufrufe } = deps({ userId: 'user_frei', plan });

    const erste = await agentRunPost(anfrage(body(ADRESSE_A, 'analysis_A')), d);
    assert(erste.status === 200, 'erste vollständige Analyse ist erlaubt');
    assert((await erste.json()).plan === 'gratis_neu', 'und wird als Gratis-Analyse gemeldet');
    assert(plan.zeilen.get('user_frei')?.usage_count === 1, 'usage_count wird auf dem Server auf 1 gezählt');
    assert(plan.zeilen.get('user_frei')?.free_analyses?.[0]?.analysis_id === 'analysis_A', 'die analysisId der Gratis-Analyse ist gespeichert');

    const nochmal = await agentRunPost(anfrage(body(ADRESSE_A, 'analysis_A')), d);
    assert(nochmal.status === 200, 'gleiche analysisId erneut: erlaubt');
    assert(plan.zeilen.get('user_frei')?.usage_count === 1, 'gleiche analysisId zählt nicht doppelt');

    const andereSchreibweise = await agentRunPost(anfrage(body('  musterstraße 1 ,  04109 LEIPZIG ', 'analysis_A2')), d);
    assert(andereSchreibweise.status === 200, 'gleiche Adresse (andere Schreibweise, neue analysisId): erlaubt');
    assert(plan.zeilen.get('user_frei')?.usage_count === 1, 'und zählt ebenfalls nicht');

    const vorher = aufrufe.workflow;
    const zweite = await agentRunPost(anfrage(body(ADRESSE_B, 'analysis_B')), d);
    const zweiteJson = await zweite.json();
    assert(zweite.status === 402, 'zweite Wohnung eines Gratis-Nutzers bekommt 402');
    assert(zweiteJson.paywall === true && zweiteJson.code === 'paywall', 'mit Paywall-Kennung für den Client');
    assert(aufrufe.workflow === vorher, 'bei 402 läuft keine KI');

    const trick = await agentRunPost(anfrage(body(ADRESSE_B, 'analysis_A')), d);
    assert(trick.status === 402, 'alte analysisId mit neuer Adresse bekommt ebenfalls 402');
    assert(plan.zeilen.get('user_frei')?.usage_count === 1, 'usage_count bleibt bei 1');
  }

  log('\n/api/agent/run: Fehlgeschlagene Analyse verbraucht nichts');
  {
    const plan = new FakePlanStore();
    const { d } = deps({ userId: 'user_fehler', plan, lauf: async () => { throw new Error('OpenAI down'); } });
    const res = await agentRunPost(anfrage(body(ADRESSE_A)), d);
    assert(res.status === 500, 'Fehler im Agent → 500');
    assert((plan.zeilen.get('user_fehler')?.usage_count ?? 0) === 0, 'Gratis-Analyse wird nur nach Erfolg gezählt');
  }

  log('\n/api/agent/run: Parallele Läufe für zwei Wohnungen');
  {
    const plan = new FakePlanStore();
    const { d } = deps({ userId: 'user_parallel', plan });
    const [a, b] = await Promise.all([
      agentRunPost(anfrage(body(ADRESSE_A, 'p1')), d),
      agentRunPost(anfrage(body(ADRESSE_B, 'p2')), d),
    ]);
    const stati = [a.status, b.status].sort();
    assert(stati[0] === 200 && stati[1] === 402, 'nur einer bekommt das Ergebnis, der andere 402');
    assert(plan.zeilen.get('user_parallel')?.usage_count === 1, 'usage_count wird genau einmal erhöht');
  }

  log('\n/api/agent/run: Premium');
  {
    const plan = new FakePlanStore();
    plan.zeilen.set('user_premium', {
      is_premium: true, premium_until: new Date(Date.now() + 86400000).toISOString(), usage_count: 5, free_analyses: [],
    });
    const { d } = deps({ userId: 'user_premium', plan });
    const res = await agentRunPost(anfrage(body(ADRESSE_B)), d);
    assert(res.status === 200, 'Premium darf jede Wohnung analysieren');
    assert(plan.zeilen.get('user_premium')?.usage_count === 5, 'Premium-Läufe zählen nicht gegen das Gratis-Kontingent');

    plan.zeilen.set('user_abgelaufen', {
      is_premium: true, premium_until: new Date(Date.now() - 1000).toISOString(), usage_count: 1, free_analyses: [],
    });
    const abgelaufen = await agentRunPost(anfrage(body(ADRESSE_B)), deps({ userId: 'user_abgelaufen', plan }).d);
    assert(abgelaufen.status === 402, 'abgelaufenes Premium mit verbrauchter Gratis-Analyse → 402');
  }

  log('\n/api/agent/run: Datenbank nicht erreichbar');
  {
    const kaputt: PlanStore = {
      lese: async () => { throw new Error('connection refused'); },
      legeAn: async () => {},
      verbuche: async () => false,
    };
    const { d, aufrufe } = deps({ userId: 'user_x', plan: undefined });
    d.planStore = kaputt;
    const res = await agentRunPost(anfrage(body(ADRESSE_A)), d);
    assert(res.status === 503 && aufrufe.workflow === 0, 'Plan nicht prüfbar → 503, keine KI (fail closed)');
  }

  log('\nRate Limit');
  {
    // Vollständige Analyse: pro Nutzer und Tag
    const plan = new FakePlanStore();
    plan.zeilen.set('user_viel', {
      is_premium: true, premium_until: new Date(Date.now() + 86400000).toISOString(), usage_count: 0, free_analyses: [],
    });
    const zaehler = new FakeZaehler();
    const { d, aufrufe } = deps({ userId: 'user_viel', plan, zaehler });
    const max = RATE_LIMITS.analyse.angemeldet[0].max;
    for (let i = 0; i < max; i++) await agentRunPost(anfrage(body(ADRESSE_A)), d);
    assert(aufrufe.workflow === max, `${max} Analysen am Tag laufen durch`);
    const zuViel = await agentRunPost(anfrage(body(ADRESSE_A)), d);
    const json = await zuViel.json();
    assert(zuViel.status === 429, `die ${max + 1}. Analyse bekommt 429`);
    assert(zuViel.headers.get('Retry-After') !== null, 'mit Retry-After-Header');
    assert(typeof json.message === 'string' && json.message.includes('morgen'), `freundliche Meldung: „${json.message}“`);
    assert(aufrufe.workflow === max, 'bei 429 läuft keine KI');
  }
  {
    // Import abgemeldet: 5 pro Stunde pro IP, andere IP unabhängig
    const zaehler = new FakeZaehler();
    const schutzDeps: SchutzDeps = { getUserId: async () => null, zaehler, env: { NODE_ENV: 'production' } };
    const req = (ip: string) => new Request('https://example.test/api/scrape-with-agent', { method: 'POST', headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } });
    const opts = { route: '/api/scrape-with-agent', bucket: 'import' as const, ki: true };
    const stunde = RATE_LIMITS.import.abgemeldet[0].max;
    let erlaubt = 0;
    for (let i = 0; i < stunde; i++) if ((await kiSchutz(req('198.51.100.1'), opts, schutzDeps)).ok) erlaubt++;
    assert(erlaubt === stunde, `abgemeldet: ${stunde} Importe pro Stunde erlaubt`);
    const sechster = await kiSchutz(req('198.51.100.1'), opts, schutzDeps);
    assert(!sechster.ok && sechster.response.status === 429, `der ${stunde + 1}. Import derselben IP bekommt 429`);
    if (!sechster.ok) {
      const json = await sechster.response.json();
      assert(json.error === json.details && json.message.includes('Stunde'), 'Meldung steht in error/details (so zeigt sie die Import-Seite an)');
    }
    assert((await kiSchutz(req('198.51.100.2'), opts, schutzDeps)).ok, 'eine andere IP ist nicht betroffen');
    assert([...zaehler.werte.keys()].every(k => !k.includes('198.51.100')), 'IPs werden nur gehasht gespeichert');
  }
  {
    // Routen, die eine Anmeldung verlangen
    const schutzDeps: SchutzDeps = { getUserId: async () => null, zaehler: new FakeZaehler(), env: { NODE_ENV: 'production' } };
    const r = await kiSchutz(new Request('https://example.test/api/chat'), { route: '/api/chat', bucket: 'chat', ki: true }, schutzDeps);
    assert(!r.ok && r.response.status === 401, '/api/chat abgemeldet → 401');
  }
  {
    // Zähler fehlt in Produktion → ablehnen
    const schutzDeps: SchutzDeps = { getUserId: async () => 'u1', zaehler: null, env: { NODE_ENV: 'production' } };
    const r = await kiSchutz(new Request('https://example.test/api/chat'), { route: '/api/chat', bucket: 'chat', ki: true }, schutzDeps);
    assert(!r.ok && r.response.status === 503, 'ohne Zählerspeicher in Produktion → 503 (fail closed)');
  }

  log('\nGlobales KI-Tagesbudget (AI_DAILY_CALL_CAP)');
  {
    const zaehler = new FakeZaehler();
    const env = { NODE_ENV: 'production', AI_DAILY_CALL_CAP: '3' };
    const ergebnisse: number[] = [];
    for (let i = 0; i < 4; i++) {
      const schutzDeps: SchutzDeps = { getUserId: async () => `user_${i}`, zaehler, env };
      const r = await kiSchutz(new Request('https://example.test/api/chat'), { route: '/api/chat', bucket: 'chat', ki: true }, schutzDeps);
      ergebnisse.push(r.ok ? 200 : r.response.status);
      if (!r.ok && i === 3) {
        const json = await r.response.json();
        assert(json.code === 'ki_budget' && json.message.includes('morgen'), 'freundliche Meldung bei erreichtem Budget');
      }
    }
    assert(ergebnisse.join(',') === '200,200,200,503', 'nach 3 KI-Aufrufen am Tag antworten KI-Routen mit 503');
    assert(fehlerLogs.some(l => l.includes('[KI-Budget] Tageslimit erreicht')), 'und es wird ein Fehler geloggt');
  }

  log('\nAdressen und Cron');
  assert(
    normalisiereAdresse(['Musterstraße 1', '04109 Leipzig'].join(', ')) === normalisiereAdresse(ADRESSE_A),
    'im PDF aufgeteilte Adresse (Titel + Ort) ergibt denselben Schlüssel',
  );
  assert(cronAutorisiert('Bearer geheim', 'geheim'), 'Cron mit richtigem Secret erlaubt');
  assert(!cronAutorisiert('Bearer falsch', 'geheim'), 'Cron mit falschem Secret abgelehnt');
  assert(!cronAutorisiert(null, 'geheim'), 'Cron ohne Header abgelehnt');
  assert(!cronAutorisiert('Bearer ', undefined), 'ohne gesetztes CRON_SECRET immer abgelehnt');

  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  console.log('\n✅ Alle Tests bestanden');
}

main().catch(e => { process.stderr.write(`${e?.stack ?? e}\n`); process.exit(1); });
