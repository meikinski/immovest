/**
 * Tests für den zentralen Tracking-Helper (dataLayer, interner Traffic, Einmal-Events)
 *
 * Ausführen mit `npx tsx src/lib/__tests__/analytics.test.ts`
 */

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

class Speicher {
  private d = new Map<string, string>();
  getItem(k: string) { return this.d.has(k) ? this.d.get(k)! : null; }
  setItem(k: string, v: string) { this.d.set(k, String(v)); }
  removeItem(k: string) { this.d.delete(k); }
  clear() { this.d.clear(); }
}

type Antwort = { internal: boolean } | 'nie';
let fetchAufrufe = 0;

/** Frische Browser-Umgebung und frisch geladenes Modul (Modulzustand je Szenario neu) */
async function umgebung({ cookie = '', antwort = { internal: false } as Antwort, local = new Speicher() } = {}) {
  fetchAufrufe = 0;
  const g = globalThis as Record<string, unknown>;
  g.window = { dataLayer: [] as Record<string, unknown>[], addEventListener: () => {} };
  g.document = { cookie };
  g.localStorage = local;
  g.sessionStorage = new Speicher();
  g.fetch = () => {
    fetchAufrufe++;
    if (antwort === 'nie') return new Promise(() => {});
    return Promise.resolve({ ok: true, json: () => Promise.resolve(antwort) });
  };
  const mod = await import(`../analytics.ts?v=${Math.random()}`) as typeof import('../analytics');
  const dl = () => (g.window as { dataLayer: Record<string, unknown>[] }).dataLayer;
  return { mod, dl, local };
}
const warte = (ms = 0) => new Promise(r => setTimeout(r, ms));

(async () => {
  // Abgemeldet: sofort senden, kein traffic_type, keine Server-Anfrage
  {
    const { mod, dl } = await umgebung();
    mod.trackEvent('kpi_result_viewed', { input_method: 'url', object_type: 'wohnung', signed_in: false });
    assert(dl().length === 1 && dl()[0].event === 'kpi_result_viewed', 'Abgemeldet: Event sofort im dataLayer');
    assert(!('traffic_type' in dl()[0]) || dl()[0].traffic_type === undefined, 'Abgemeldet: kein traffic_type');
    assert(fetchAufrufe === 0, 'Abgemeldet: keine Anfrage an den Server');
    mod.trackEvent('paywall_viewed', { trigger: 'pdf_export' });
    assert(dl()[1].input_method === undefined && 'input_method' in dl()[1], 'Parameter des vorigen Events werden zurückgesetzt');
    assert(dl()[1].trigger === 'pdf_export', 'Eigene Parameter bleiben erhalten');
  }

  // Angemeldet, intern: Events warten auf die Antwort und bekommen traffic_type
  {
    const { mod, dl, local } = await umgebung({ cookie: '__client_uat=1731590000', antwort: { internal: true } });
    mod.trackEvent('sign_up_page_viewed', { source: 'header' });
    mod.trackEvent('cta_clicked', { cta_name: 'start_analysis', cta_location: 'hero' });
    assert(dl().length === 0, 'Intern: Events warten, bis der Status feststeht');
    await warte();
    assert(dl().length === 2, 'Intern: beide Events danach gesendet');
    assert(dl()[0].event === 'sign_up_page_viewed' && dl()[1].event === 'cta_clicked', 'Reihenfolge bleibt erhalten');
    assert(dl().every(e => e.traffic_type === 'internal'), 'Intern: traffic_type "internal" an jedem Event');
    assert(!JSON.stringify(dl()).includes('@'), 'Keine E-Mail im dataLayer');
    mod.trackEvent('pdf_downloaded', { plan: 'free' });
    assert(dl()[2].traffic_type === 'internal' && fetchAufrufe === 1, 'Folgende Events direkt intern, nur eine Anfrage');
    assert(local.getItem('analytics_internal_device') === '1', 'Gerät als intern gemerkt');

    // Gleiches Gerät, später abgemeldet: bleibt intern
    const zwei = await umgebung({ local });
    zwei.mod.trackEvent('cta_clicked', { cta_name: 'x', cta_location: 'y' });
    assert(zwei.dl()[0].traffic_type === 'internal' && fetchAufrufe === 0, 'Intern erkanntes Gerät bleibt intern, auch abgemeldet');
  }

  // Angemeldet, extern
  {
    const { mod, dl } = await umgebung({ cookie: 'a=1; __client_uat=1731590000', antwort: { internal: false } });
    mod.trackEvent('analysis_completed', { analysis_number: 1, plan: 'free' });
    await warte();
    assert(dl().length === 1 && dl()[0].traffic_type === undefined, 'Extern: Event ohne traffic_type');
  }

  // Server antwortet nicht: nach 2,5 s ohne traffic_type senden
  {
    const { mod, dl } = await umgebung({ cookie: '__client_uat=1', antwort: 'nie' });
    mod.trackEvent('checkout_started', { plan: 'yearly', value: 99, currency: 'EUR' });
    assert(dl().length === 0, 'Ohne Antwort: Event wartet zunächst');
    await warte(2600);
    assert(dl().length === 1 && dl()[0].event === 'checkout_started', 'Ohne Antwort: nach Zeitlimit trotzdem gesendet');
  }

  // purchase: einmal je transaction_id
  {
    const { mod, dl } = await umgebung();
    mod.trackSubscriptionPurchase('premium_yearly', 'cs_test_1', 99);
    mod.trackSubscriptionPurchase('premium_yearly', 'cs_test_1', 99);
    mod.trackSubscriptionPurchase('premium_monthly', 'cs_test_2', 12);
    const kaeufe = dl().filter(e => e.event === 'purchase');
    assert(kaeufe.length === 2, 'purchase je transaction_id nur einmal');
    assert(kaeufe[0].plan === 'yearly' && kaeufe[0].currency === 'EUR' && kaeufe[0].value === 99, 'purchase mit plan, value, currency');
  }

  // analysis_saved: manuell jedes Mal, automatisch einmal je Analyse
  {
    const { mod, dl } = await umgebung();
    mod.meldeAnalyseGespeichert({ analysisId: 'a1', saveType: 'auto', plan: 'free' });
    mod.meldeAnalyseGespeichert({ analysisId: 'a1', saveType: 'auto', plan: 'free' });
    mod.meldeAnalyseGespeichert({ analysisId: 'a1', saveType: 'manual', plan: 'free' });
    const s = dl().filter(e => e.event === 'analysis_saved');
    assert(s.length === 2 && s[0].save_type === 'auto' && s[1].save_type === 'manual', 'analysis_saved: Auto-Speichern einmal, manuell immer');
  }

  // analysis_completed: einmal je Wohnung, analysis_number zählt hoch
  {
    const { mod, dl } = await umgebung();
    mod.meldeAnalyseAbgeschlossen({ userId: 'u', schluessel: 'w1', plan: 'free' });
    mod.meldeAnalyseAbgeschlossen({ userId: 'u', schluessel: 'w1', plan: 'free' });
    mod.meldeAnalyseAbgeschlossen({ userId: 'u', schluessel: 'w2', plan: 'premium' });
    const a = dl().filter(e => e.event === 'analysis_completed');
    assert(a.length === 2 && a[0].analysis_number === 1 && a[1].analysis_number === 2, 'analysis_completed einmal je Wohnung, Nummer zählt');
  }

  // Import: nur die Domain
  {
    const { mod } = await umgebung();
    assert(mod.importDomain(' https://www.immobilienscout24.de/expose/123?token=abc ') === 'immobilienscout24.de', 'Import-URL wird auf die Domain gekürzt');
    assert(mod.importDomain('kein link') === 'invalid', 'Ungültige URL → invalid');
  }

  // Jedes Event aus GA4_EVENTS ist ein bekanntes Event
  {
    const { mod } = await umgebung();
    const namen = Object.values(mod.AnalyticsEvents) as string[];
    assert(mod.GA4_EVENTS.every(e => namen.includes(e)), 'GA4_EVENTS enthält nur definierte Events');
    assert(!namen.includes('signup_initiated'), 'signup_initiated gibt es nicht mehr');
  }

  console.log('\nAlle Analytics-Tests bestanden.');
})().catch(e => { console.error(e); process.exit(1); });
