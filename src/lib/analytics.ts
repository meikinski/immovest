/**
 * Zentraler Tracking-Helper: alle Events laufen über trackEvent() in den GTM-dataLayer.
 * GTM leitet sie mit einem generischen GA4-Tag weiter (Anleitung: docs/GTM_GA4_SETUP.md).
 *
 * Regeln:
 * - Keine personenbezogenen Daten in Events (keine E-Mail, kein Name, keine User-ID, keine Adresse).
 * - Interne Nutzer (INTERNAL_USER_EMAILS, serverseitig geprüft) bekommen traffic_type: "internal" an jedem Event.
 * - Vor jedem Event werden alle bekannten Parameter auf undefined gesetzt, damit kein Wert aus einem
 *   früheren Event an einem späteren hängen bleibt (GTM merkt sich dataLayer-Werte).
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export const AnalyticsEvents = {
  // Import
  AI_IMPORT_STARTED: 'ai_import_started',
  AI_IMPORT_COMPLETED: 'ai_import_completed',
  AI_IMPORT_FAILED: 'ai_import_failed',

  // Analyse
  KPI_RESULT_VIEWED: 'kpi_result_viewed', // KPI-Ergebnis sichtbar, auch für Gäste (input_method, object_type, signed_in)
  ANALYSIS_COMPLETED: 'analysis_completed', // vollständige Analyse fertig: Markt, KI, Prognose (analysis_number, plan)
  LOCKED_PREVIEW_CLICKED: 'locked_preview_clicked', // Gast klickt auf eine gesperrte Vorschau (section, action)
  COMPARE_CTA_CLICKED: 'compare_cta_clicked', // „Zweite Wohnung prüfen" (plan)
  ANALYSIS_SAVED: 'analysis_saved', // Analyse im Konto gespeichert (save_type: manual | auto, plan)
  PDF_DOWNLOADED: 'pdf_downloaded', // PDF-Report wirklich heruntergeladen (plan)

  // Registrierung
  SIGN_UP_PAGE_VIEWED: 'sign_up_page_viewed', // /sign-up aufgerufen (source, has_property)
  SIGN_UP: 'sign_up', // GA4-Standardereignis: nur bei neu angelegtem Konto (method)
  SIGNUP_COMPLETED: 'signup_completed', // Altbestand, parallel zu sign_up, nicht für GA4
  ADS_CONVERSION_SIGNUP: 'ads_conversion_signup', // Google-Ads-Conversion, nicht für GA4

  // Monetarisierung
  PAYWALL_VIEWED: 'paywall_viewed', // (trigger, source, signed_in, free_analyses_used)
  UPGRADE_CLICKED: 'upgrade_clicked', // (plan_name, click_location)
  CHECKOUT_STARTED: 'checkout_started', // vor der Weiterleitung zu Stripe (plan, value, currency)
  PURCHASE_COMPLETED: 'purchase', // einmal je transaction_id (transaction_id, value, currency, plan)

  // Engagement
  CTA_CLICKED: 'cta_clicked', // Start-Buttons auf Startseite und Preisseite (cta_name, cta_location)
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** Events, die GTM an GA4 weitergeben soll (Regex im Trigger, siehe docs/GTM_GA4_SETUP.md) */
export const GA4_EVENTS: AnalyticsEventName[] = [
  'ai_import_started', 'ai_import_completed', 'ai_import_failed',
  'kpi_result_viewed', 'analysis_completed', 'locked_preview_clicked', 'compare_cta_clicked',
  'analysis_saved', 'pdf_downloaded',
  'sign_up_page_viewed', 'sign_up',
  'paywall_viewed', 'upgrade_clicked', 'checkout_started', 'purchase',
  'cta_clicked',
];

/** Alle Parameter, die Events setzen. Jede Variable in GTM entspricht einem Eintrag. */
export const EVENT_PARAMS = [
  'import_method', 'import_domain', 'has_warnings', 'missing_fields', 'error',
  'input_method', 'object_type', 'signed_in',
  'analysis_number', 'plan', 'save_type',
  'section', 'action',
  'source', 'has_property', 'method',
  'trigger', 'free_analyses_used',
  'plan_name', 'click_location', 'founder_price', 'return_to',
  'value', 'currency', 'transaction_id', 'items', 'subscription_plan_id', 'subscription_interval',
  'cta_name', 'cta_location',
  'traffic_type',
] as const;

// ---------------------------------------------------------------------------
// Interner Traffic
// ---------------------------------------------------------------------------

type TrafficStatus = 'unknown' | 'pending' | 'internal' | 'external';

const INTERN_GERAET_KEY = 'analytics_internal_device';
const INTERN_CACHE_KEY = 'analytics_traffic_type';
const WARTEZEIT_MS = 2500;

let trafficStatus: TrafficStatus = 'unknown';
let warteschlange: Array<{ eventName: string; params: Record<string, unknown> }> = [];
let warteTimer: ReturnType<typeof setTimeout> | null = null;

/** Clerk setzt __client_uat (nicht httpOnly): "0" oder fehlend = abgemeldet, sonst Zeitpunkt der letzten Anmeldung */
const clerkAnmeldung = (): string | null => {
  const m = document.cookie.match(/(?:^|;\s*)__client_uat=([^;]*)/);
  return m && m[1] && m[1] !== '0' ? m[1] : null;
};

const leseSpeicher = (speicher: Storage, key: string): string | null => {
  try { return speicher.getItem(key); } catch { return null; }
};
const schreibeSpeicher = (speicher: Storage, key: string, wert: string) => {
  try { speicher.setItem(key, wert); } catch { /* privater Modus */ }
};

const pushEvent = (eventName: string, params: Record<string, unknown>) => {
  window.dataLayer = window.dataLayer || [];
  const zuruecksetzen = Object.fromEntries(EVENT_PARAMS.map(p => [p, undefined]));
  const payload = {
    ...zuruecksetzen,
    ...params,
    ...(trafficStatus === 'internal' ? { traffic_type: 'internal' } : {}),
    event: eventName,
  };
  window.dataLayer.push(payload);
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, params, trafficStatus === 'internal' ? '(internal)' : '');
  }
};

const abarbeiten = (status: 'internal' | 'external') => {
  trafficStatus = status;
  if (warteTimer) { clearTimeout(warteTimer); warteTimer = null; }
  const offen = warteschlange;
  warteschlange = [];
  offen.forEach(e => pushEvent(e.eventName, e.params));
};

/**
 * Status ermitteln, ohne die E-Mail je in den Browser zu holen: Der Server vergleicht die Konto-E-Mail
 * mit INTERNAL_USER_EMAILS und antwortet nur mit internal: true/false.
 * Einmal als intern erkannte Geräte bleiben intern (auch abgemeldet).
 */
const ermittleStatus = () => {
  if (trafficStatus !== 'unknown') return;
  if (leseSpeicher(localStorage, INTERN_GERAET_KEY) === '1') { trafficStatus = 'internal'; return; }

  const anmeldung = clerkAnmeldung();
  if (!anmeldung) { trafficStatus = 'external'; return; }

  const cache = leseSpeicher(sessionStorage, INTERN_CACHE_KEY);
  if (cache === `${anmeldung}:external`) { trafficStatus = 'external'; return; }

  trafficStatus = 'pending';
  warteTimer = setTimeout(() => abarbeiten('external'), WARTEZEIT_MS);
  fetch('/api/analytics/traffic-type', { credentials: 'same-origin', cache: 'no-store' })
    .then(r => (r.ok ? r.json() : { internal: false }))
    .then((d: { internal?: boolean }) => {
      if (d.internal === true) {
        schreibeSpeicher(localStorage, INTERN_GERAET_KEY, '1');
        abarbeiten('internal');
      } else {
        schreibeSpeicher(sessionStorage, INTERN_CACHE_KEY, `${anmeldung}:external`);
        if (trafficStatus === 'pending') abarbeiten('external');
      }
    })
    .catch(() => { if (trafficStatus === 'pending') abarbeiten('external'); });

  // Seitenwechsel (z. B. Weiterleitung zu Stripe): nichts in der Warteschlange verlieren
  window.addEventListener('pagehide', () => { if (trafficStatus === 'pending') abarbeiten('external'); }, { once: true });
};

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

/**
 * Einziger Weg, ein Event zu senden. Solange noch geprüft wird, ob der Nutzer intern ist
 * (höchstens 2,5 s, nur bei angemeldeten Nutzern einmal je Sitzung), werden Events gepuffert.
 */
export const trackEvent = (eventName: AnalyticsEventName, eventParams: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;
  ermittleStatus();
  if (trafficStatus === 'pending') {
    warteschlange.push({ eventName, params: eventParams });
    return;
  }
  pushEvent(eventName, eventParams);
};

/** Einmal-Events: true, wenn der Schlüssel schon gemeldet wurde, sonst merken und false */
const schonGemeldet = (speicherKey: string, schluessel: string, max = 100): boolean => {
  let liste: string[] = [];
  try { liste = JSON.parse(localStorage.getItem(speicherKey) || '[]'); } catch { /* privater Modus */ }
  if (!Array.isArray(liste)) liste = [];
  if (liste.includes(schluessel)) return true;
  schreibeSpeicher(localStorage, speicherKey, JSON.stringify([...liste, schluessel].slice(-max)));
  return false;
};

/**
 * Eingabemethode der laufenden Analyse (url, screenshot, manual) für kpi_result_viewed merken
 */
export type EingabeMethode = 'url' | 'screenshot' | 'manual';
const EINGABE_METHODE_KEY = 'analytics_eingabe_methode';

export const merkeEingabeMethode = (methode: EingabeMethode) => {
  schreibeSpeicher(sessionStorage, EINGABE_METHODE_KEY, methode);
};

export const leseEingabeMethode = (): EingabeMethode | 'unknown' => {
  return (leseSpeicher(sessionStorage, EINGABE_METHODE_KEY) as EingabeMethode | null) || 'unknown';
};

/** Nur die Domain der Import-URL melden (keine Pfade oder Query-Parameter) */
export const importDomain = (url: string): string => {
  try { return new URL(url.trim()).hostname.replace(/^www\./, ''); } catch { return 'invalid'; }
};

/**
 * analysis_completed: einmal je Wohnung, sobald die vollständige Analyse (Markt, KI, Prognose) fertig ist.
 * analysis_number zählt die abgeschlossenen vollständigen Analysen dieses Kontos in diesem Browser.
 */
export const meldeAnalyseAbgeschlossen = (
  { userId, schluessel, plan }: { userId: string | null | undefined; schluessel: string; plan: 'free' | 'premium' }
) => {
  const speicher = `analytics_analysis_completed_${userId || 'gast'}`;
  let erledigt: string[] = [];
  try { erledigt = JSON.parse(localStorage.getItem(speicher) || '[]'); } catch { /* privater Modus */ }
  if (!Array.isArray(erledigt)) erledigt = [];
  if (erledigt.includes(schluessel)) return;
  trackEvent(AnalyticsEvents.ANALYSIS_COMPLETED, { analysis_number: erledigt.length + 1, plan });
  schreibeSpeicher(localStorage, speicher, JSON.stringify([...erledigt, schluessel].slice(-500)));
};

/**
 * analysis_saved: manuell bei jedem erfolgreichen Klick auf „Analyse speichern",
 * automatisch (Gratis-Analyse) nur beim ersten erfolgreichen Speichern je Analyse.
 */
export const meldeAnalyseGespeichert = (
  { analysisId, saveType, plan }: { analysisId: string; saveType: 'manual' | 'auto'; plan: 'free' | 'premium' }
) => {
  if (saveType === 'auto' && schonGemeldet('analytics_analysis_saved_auto', analysisId)) return;
  trackEvent(AnalyticsEvents.ANALYSIS_SAVED, { save_type: saveType, plan });
};

export type SubscriptionPlanId = 'premium_monthly' | 'premium_yearly';

/**
 * purchase: einmal je transaction_id (Neuladen der Rückkehrseite, zweiter Tab)
 */
export const trackSubscriptionPurchase = (
  planId: SubscriptionPlanId,
  transactionId: string,
  value: number
) => {
  if (schonGemeldet('analytics_purchase_ids', transactionId, 20)) return;
  const isYearly = planId === 'premium_yearly';
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    transaction_id: transactionId,
    value,
    currency: 'EUR',
    plan: isYearly ? 'yearly' : 'monthly',
    subscription_plan_id: planId,
    subscription_interval: isYearly ? 'year' : 'month',
    items: [
      {
        item_id: planId,
        item_name: isYearly ? 'imvestr Premium – Jahresabo' : 'imvestr Premium – Monatsabo',
        price: value,
        quantity: 1,
      },
    ],
  });
};
