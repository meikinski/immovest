/**
 * Tests für die Datenschutz-Filter der Fehlerüberwachung
 *
 * Ausführen mit `npx tsx src/lib/__tests__/monitoring-datenschutz.test.ts`
 */
import { bereinigeBreadcrumb, bereinigeEvent, bereinigeText, bereinigeUrl, hashNutzerId } from '../monitoring/datenschutz';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`✓ ${message}`);
}

const kein = (text: string, ...verboten: string[]) => verboten.every((v) => !text.includes(v));

// Adressen und personenbezogene Daten in Texten
const t1 = bereinigeText('Geocoding fehlgeschlagen für Musterstraße 12a, 10115 Berlin');
assert(kein(t1, 'Musterstraße', '10115', 'Berlin'), `Straße, PLZ und Ort entfernt: "${t1}"`);
const t2 = bereinigeText('Speichern fehlgeschlagen: Hauptstr. 7, 80331 München-Altstadt');
assert(kein(t2, 'Hauptstr', '80331', 'München'), `Abgekürzte Straße entfernt: "${t2}"`);
const t3 = bereinigeText('Am Kirchplatz 3 und Lindenallee 14');
assert(kein(t3, 'Kirchplatz 3', 'Lindenallee 14'), `Platz/Allee entfernt: "${t3}"`);
const t4 = bereinigeText('Kontakt max.mustermann@example.com, Tel. +49 170 1234567, user_2abcdEFGHijkLMNop');
assert(kein(t4, 'max.mustermann', '1234567', 'user_2abcdEFGHijkLMNop'), `E-Mail, Telefon, Clerk-ID entfernt: "${t4}"`);
const t5 = bereinigeText('Supabase: 22001 value too long for type character varying(50)');
assert(t5.includes('22001') && t5.includes('character varying(50)'), 'Technische Fehlertexte bleiben lesbar');
assert(bereinigeText('Kaufpreis 250000 ungültig').includes('250000'), 'Zahlen ohne Ort bleiben');

// URLs: nur der Pfad
assert(bereinigeUrl('https://imvestr.de/api/geocode?q=Musterstra%C3%9Fe%201') === 'https://imvestr.de/api/geocode', 'Query der URL entfernt');

assert(kein(bereinigeText('Fehler bei GET /api/geocode?q=Musterstra%C3%9Fe%201 (500)'), 'Musterstra', 'q='), 'Query in freiem Text entfernt (auch URL-kodiert)');

// Ganzes Ereignis
const event = bereinigeEvent({
  message: 'POST /api/analysis antwortet mit HTTP 500',
  exception: { values: [{ type: 'Error', value: 'Adresse Bahnhofstraße 1, 04109 Leipzig nicht gefunden' }] },
  request: { url: 'https://imvestr.de/api/analysis?adresse=x', data: { adresse: 'Bahnhofstraße 1' }, cookies: { __session: 'jwt' }, headers: { authorization: 'Bearer x' }, query_string: 'adresse=x' },
  user: { id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', email: 'a@b.de', ip_address: '1.2.3.4' },
  extra: { adresse: 'Bahnhofstraße 1', kaufpreis: 250000, nested: { email: 'a@b.de', hinweis: 'in 04109 Leipzig' } },
  contexts: {
    browser: { name: 'Chrome', version: '120' },
    diagnose: { db_code: '22001', city: 'Leipzig' },
    nextjs: { request_path: '/api/geocode?q=Bahnhofstra%C3%9Fe+1', router_path: '/api/geocode', route_type: 'route' },
  },
  breadcrumbs: [
    { category: 'console', message: '[StatePersistence] adresse Bahnhofstraße 1' },
    { category: 'fetch', data: { url: '/api/geocode?q=Bahnhofstra%C3%9Fe', method: 'GET', status_code: 500, request_body_size: 10 } },
  ],
  server_name: 'host-123',
});
const alles = JSON.stringify(event);
assert(kein(alles, 'Bahnhofstraße', '04109', 'Leipzig', 'a@b.de', '1.2.3.4', 'jwt', 'Bearer', 'adresse=x'), 'Ereignis enthält keine Adresse, E-Mail, IP, Cookies oder Header');
assert(event.user?.id === 'a1b2c3d4e5f60718293a4b5c6d7e8f90' && Object.keys(event.user!).length === 1, 'Nutzer nur als Hash');
assert((event.extra as { kaufpreis?: number }).kaufpreis === 250000, 'Unkritische Extras bleiben');
assert(event.contexts?.browser?.name === 'Chrome' && event.contexts?.diagnose?.db_code === '22001', 'Browser und Diagnose-Code bleiben');
assert(event.contexts?.nextjs?.request_path === '/api/geocode' && !alles.includes('Bahnhofstra%C3%9Fe'), 'Next.js-Kontext: Pfad ohne Query');
assert(event.breadcrumbs?.length === 1 && event.breadcrumbs[0]!.data?.url === '/api/geocode' && event.breadcrumbs[0]!.data?.status_code === 500, 'Konsole fällt weg, Fetch nur mit Pfad und Status');
assert(event.server_name === undefined, 'Servername entfernt');

assert(bereinigeEvent({ user: { id: 'user_2abcdEFGHijkLMNop' } }).user === undefined, 'Klar-ID statt Hash: kein Nutzer');
assert(bereinigeBreadcrumb({ category: 'console', message: 'x' }) === null, 'Konsolen-Breadcrumb verworfen');

// Hash: stabil, 32 Hex-Zeichen, abhängig vom Salz, ohne die ID
(async () => {
  const a = await hashNutzerId('user_2abcdEFGHijkLMNop', 'salz');
  const b = await hashNutzerId('user_2abcdEFGHijkLMNop', 'salz');
  const c = await hashNutzerId('user_2abcdEFGHijkLMNop', 'anderes');
  assert(!!a && /^[0-9a-f]{32}$/.test(a), `Hash hat 32 Hex-Zeichen (${a})`);
  assert(a === b && a !== c, 'Hash ist stabil und hängt vom Salz ab');
  assert(bereinigeEvent({ user: { id: a! } }).user?.id === a, 'Gehashte ID passiert den Filter');
  console.log('\nAlle Tests der Datenschutz-Filter bestanden.');
})().catch((e) => { console.error(e); process.exit(1); });
