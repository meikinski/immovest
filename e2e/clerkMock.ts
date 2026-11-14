/**
 * Clerk-Attrappe für Ende-zu-Ende-Tests ohne Clerk-Konto und ohne Netz.
 *
 * - Der Browser lädt clerk-js und @clerk/ui aus den npm-Paketen (lokal entpackt, siehe CLERK_PAKETE)
 *   statt vom Clerk-CDN.
 * - Die Frontend-API (environment, client, sign_ins, sessions) beantwortet diese Datei.
 * - Sitzungs-Tokens sind echte RS256-JWTs. Der Next-Server prüft sie offline über CLERK_JWT_KEY,
 *   damit auth() auf dem Server dieselbe Anmeldung sieht wie der Browser.
 */
import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Route } from 'playwright';

/** Erfundene Frontend-API-Domain; im Publishable Key kodiert */
export const FAPI_HOST = 'clerk.imvestr-test.dev';
export const PUBLISHABLE_KEY = `pk_live_${Buffer.from(`${FAPI_HOST}$`).toString('base64').replace(/=+$/, '')}`;
export const SECRET_KEY = 'sk_live_e2e_attrappe_0000000000000000000000';

export const TEST_USER = { id: 'user_e2eTestNutzer0001', email: 'test@example.com', password: 'Passwort-1234' };

export type ClerkPakete = { clerkJs: string; ui: string };

/** Schlüsselpaar für die Sitzungs-JWTs. Der öffentliche Schlüssel geht als CLERK_JWT_KEY an den Server. */
export function erzeugeSchluessel() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(), privateKey };
}

function b64url(daten: Buffer | string) {
  return Buffer.from(daten).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signiereJwt(privateKey: KeyObject, sessionId: string) {
  const jetzt = Math.floor(Date.now() / 1000);
  const kopf = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'ins_e2e' }));
  const inhalt = b64url(JSON.stringify({
    sub: TEST_USER.id, sid: sessionId, iss: `https://${FAPI_HOST}`, iat: jetzt - 5, nbf: jetzt - 5, exp: jetzt + 3600, v: 2,
  }));
  const signatur = createSign('RSA-SHA256').update(`${kopf}.${inhalt}`).sign(privateKey);
  return `${kopf}.${inhalt}.${b64url(signatur)}`;
}

// Zeitstempel der Clerk-Objekte leicht in der Vergangenheit: __client_uat darf nicht jünger sein als das Token (iat)
const jetztMs = () => Date.now() - 10 * 60_000;

const ENVIRONMENT = {
  object: 'environment',
  id: 'env_e2e',
  maintenance_mode: false,
  client_debug_mode: false,
  auth_config: {
    object: 'auth_config', id: 'aac_e2e', single_session_mode: true, claimed_at: null, reverification: false,
    preferred_channels: null,
  },
  display_config: {
    object: 'display_config', id: 'display_config_e2e', instance_environment_type: 'production',
    application_name: 'Imvestr', theme: { general: { color: '#ff6b00', show_clerk_branding: false } },
    preferred_sign_in_strategy: 'password', logo_image_url: '', favicon_image_url: '',
    home_url: 'http://localhost', sign_in_url: '/sign-in', sign_up_url: '/sign-up', user_profile_url: '',
    waitlist_url: '', after_sign_in_url: '/', after_sign_up_url: '/', after_sign_out_one_url: '/',
    after_sign_out_all_url: '/', after_switch_session_url: '/', after_join_waitlist_url: '/',
    organization_profile_url: '', create_organization_url: '', after_leave_organization_url: '',
    after_create_organization_url: '', support_email: '', branded: false, experimental_force_oauth_first: false,
    clerk_js_version: '6', show_devmode_warning: false, google_one_tap_client_id: null, help_url: null,
    privacy_policy_url: '', terms_url: '', logo_link_url: '', captcha_public_key: null, captcha_widget_type: null,
    captcha_public_key_invisible: null, captcha_provider: null, captcha_oauth_bypass: [],
  },
  user_settings: {
    attributes: {
      email_address: {
        enabled: true, required: true, used_for_first_factor: true, first_factors: ['email_code'],
        used_for_second_factor: false, second_factors: [], verifications: ['email_code'], verify_at_sign_up: true,
      },
      phone_number: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      username: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      web3_wallet: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      first_name: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      last_name: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      password: { enabled: true, required: true, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      authenticator_app: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      ticket: { enabled: true, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      backup_code: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
      passkey: { enabled: false, required: false, used_for_first_factor: false, first_factors: [], used_for_second_factor: false, second_factors: [], verifications: [], verify_at_sign_up: false },
    },
    sign_in: { second_factor: { required: false } },
    sign_up: {
      captcha_enabled: false, captcha_widget_type: 'smart', custom_action_required: false, progressive: true,
      mode: 'public', legal_consent_enabled: false,
    },
    restrictions: {
      allowlist: { enabled: false }, blocklist: { enabled: false }, block_email_subaddresses: { enabled: false },
      block_disposable_email_domains: { enabled: false }, ignore_dots_for_gmail_addresses: { enabled: false },
    },
    username_settings: { min_length: 4, max_length: 64 },
    actions: { delete_self: true, create_organization: false },
    social: {
      oauth_google: {
        enabled: true, required: false, authenticatable: true, block_email_subaddresses: false,
        strategy: 'oauth_google', not_selectable: false, deprecated: false, name: 'Google', logo_url: '',
      },
    },
    saml: { enabled: false },
    enterprise_sso: { enabled: false },
    password_settings: {
      disable_hibp: true, min_length: 8, max_length: 72, require_special_char: false, require_numbers: false,
      require_uppercase: false, require_lowercase: false, show_zxcvbn: false, min_zxcvbn_strength: 0,
      enforce_hibp_on_sign_in: false, allowed_special_characters: '!"#$%&\'()*+,-./:;<=>?@[]^_`{|}~',
    },
    passkey_settings: { allow_autofill: false, show_sign_in_button: false },
  },
  organization_settings: {
    enabled: false, max_allowed_memberships: 5, actions: { admin_delete: true },
    domains: { enabled: false, enrollment_modes: [], default_role: null }, force_organization_selection: false,
  },
  commerce_settings: {
    billing: {
      enabled: false, stripe_publishable_key: '', has_paid_user_plans: false, has_paid_org_plans: false,
      user: { enabled: false, has_paid_plans: false }, organization: { enabled: false, has_paid_plans: false },
    },
  },
  api_keys_settings: { enabled: false, user_api_keys_enabled: false, orgs_api_keys_enabled: false },
};

type Zustand = { angemeldet: boolean; signIn: Record<string, unknown> | null };

function nutzer() {
  return {
    object: 'user', id: TEST_USER.id, username: null, first_name: 'Test', last_name: 'Nutzer', image_url: '',
    has_image: false, primary_email_address_id: 'idn_e2e', primary_phone_number_id: null, primary_web3_wallet_id: null,
    password_enabled: true, two_factor_enabled: false, totp_enabled: false, backup_code_enabled: false,
    email_addresses: [{
      object: 'email_address', id: 'idn_e2e', email_address: TEST_USER.email, reserved: false,
      verification: { object: 'verification', status: 'verified', strategy: 'email_code', attempts: 1, expire_at: null },
      linked_to: [], created_at: jetztMs(), updated_at: jetztMs(),
    }],
    phone_numbers: [], web3_wallets: [], external_accounts: [], passkeys: [], enterprise_accounts: [], saml_accounts: [],
    organization_memberships: [], public_metadata: {}, unsafe_metadata: {}, external_id: null, last_sign_in_at: jetztMs(),
    banned: false, locked: false, created_at: jetztMs(), updated_at: jetztMs(), delete_self_enabled: true,
    create_organization_enabled: false, legal_accepted_at: null,
  };
}

function sitzung(jwt: string) {
  return {
    object: 'session', id: 'sess_e2eTestSitzung0001', status: 'active', expire_at: jetztMs() + 86_400_000,
    abandon_at: jetztMs() + 86_400_000 * 7, last_active_at: jetztMs(), last_active_organization_id: null,
    actor: null, user: nutzer(), public_user_data: { first_name: 'Test', last_name: 'Nutzer', image_url: '', has_image: false, identifier: TEST_USER.email },
    factor_verification_age: [0, -1], created_at: jetztMs(), updated_at: jetztMs(),
    last_active_token: { object: 'token', jwt },
  };
}

function client(z: Zustand, jwt: string) {
  const sessions = z.angemeldet ? [sitzung(jwt)] : [];
  return {
    object: 'client', id: 'client_e2e', sessions, sign_in: z.signIn, sign_up: null,
    last_active_session_id: z.angemeldet ? 'sess_e2eTestSitzung0001' : null, last_authentication_strategy: null,
    cookie_expires_at: null, captcha_bypass: false, created_at: jetztMs(), updated_at: jetztMs(),
  };
}

function signInObjekt(status: string) {
  return {
    object: 'sign_in_attempt', id: 'sia_e2eTestAnmeldung01', status, identifier: TEST_USER.email,
    supported_identifiers: ['email_address'],
    supported_first_factors: [
      { strategy: 'password' },
      { strategy: 'email_code', safe_identifier: TEST_USER.email, email_address_id: 'idn_e2e', primary: true },
    ],
    supported_second_factors: null, first_factor_verification: null, second_factor_verification: null,
    user_data: { first_name: 'Test', last_name: 'Nutzer', image_url: '', has_image: false },
    created_session_id: status === 'complete' ? 'sess_e2eTestSitzung0001' : null, abandon_at: jetztMs() + 3_600_000,
  };
}

const MIME: Record<string, string> = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json' };

/**
 * Clerk im Browser-Kontext simulieren. Gibt Steuerfunktionen zurück.
 * Die Anmeldung gelingt mit TEST_USER (E-Mail und Passwort).
 */
export async function installiereClerkMock(context: BrowserContext, pakete: ClerkPakete, privateKey: KeyObject) {
  const z: Zustand = { angemeldet: false, signIn: null };
  const jwt = () => signiereJwt(privateKey, 'sess_e2eTestSitzung0001');

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': route.request().headers().origin || '*', 'access-control-allow-credentials': 'true' }, body: JSON.stringify(body) });

  // Google-Logo der Clerk-Schaltfläche (img.clerk.com) als schlichtes „G"
  await context.route('https://img.clerk.com/**', (route) => route.fulfill({
    status: 200, contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#4285F4"/><text x="12" y="17" font-size="14" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">G</text></svg>',
  }));

  await context.route(`https://${FAPI_HOST}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;

    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: {
        'access-control-allow-origin': req.headers().origin || '*', 'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-allow-headers': '*',
      } });
    }

    // Skripte aus den lokalen npm-Paketen
    const skript = p.match(/^\/npm\/@clerk\/(clerk-js|ui)@[^/]+\/dist\/(.+)$/);
    if (skript) {
      const basis = skript[1] === 'ui' ? pakete.ui : pakete.clerkJs;
      const datei = path.join(basis, 'dist', path.basename(skript[2]!));
      if (!existsSync(datei)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ status: 200, contentType: MIME[path.extname(datei)] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(datei) });
    }

    if (p === '/v1/environment') return json(route, ENVIRONMENT);

    if (p === '/v1/client' && (req.method() === 'GET' || req.method() === 'PUT' || req.method() === 'POST')) {
      return json(route, { response: client(z, jwt()), client: null });
    }

    if (p === '/v1/client/sign_ins' && req.method() === 'POST') {
      const form = new URLSearchParams(req.postData() || '');
      // Formular mit E-Mail und Passwort in einem Schritt: direkt prüfen
      if (form.get('password') === null) {
        z.signIn = signInObjekt('needs_first_factor');
        return json(route, { response: z.signIn, client: client(z, jwt()) });
      }
    }

    if (/^\/v1\/client\/sign_ins(\/[^/]+\/attempt_first_factor)?$/.test(p) && req.method() === 'POST') {
      const form = new URLSearchParams(req.postData() || '');
      if (form.get('password') !== TEST_USER.password) {
        return json(route, { errors: [{ code: 'form_password_incorrect', message: 'Password is incorrect', long_message: 'Password is incorrect. Try again, or use another method.', meta: { param_name: 'password' } }] }, 422);
      }
      z.angemeldet = true;
      z.signIn = signInObjekt('complete');
      // clerk-js setzt __client_uat auf der Hauptdomain; für „localhost" gibt es keine, daher hier setzen.
      // Ohne das Cookie sieht der Server (auth()) die Sitzung nicht.
      await context.addCookies([{ name: '__client_uat', value: String(Math.floor(jetztMs() / 1000)), domain: 'localhost', path: '/' }]);
      const antwort = { response: z.signIn, client: client(z, jwt()) };
      z.signIn = null;
      return json(route, antwort);
    }

    if (/^\/v1\/client\/sign_ins\/[^/]+$/.test(p)) {
      return json(route, { response: z.signIn, client: client(z, jwt()) });
    }

    if (/^\/v1\/client\/sessions\/[^/]+\/tokens/.test(p)) {
      return json(route, { object: 'token', jwt: jwt() });
    }

    if (/^\/v1\/client\/sessions\/[^/]+\/touch$/.test(p)) {
      return json(route, { response: sitzung(jwt()), client: client(z, jwt()) });
    }

    if (/^\/v1\/client\/sessions\/[^/]+\/(end|remove)$/.test(p) || p === '/v1/client/sessions') {
      z.angemeldet = false;
      return json(route, { response: client(z, jwt()), client: client(z, jwt()) });
    }

    if (p.startsWith('/v1/me')) return json(route, { response: nutzer(), client: client(z, jwt()) });

    // Unbekannt: leer, aber gültig
    return json(route, { response: null, client: client(z, jwt()) });
  });

  return {
    zustand: z,
    istAngemeldet: () => z.angemeldet,
  };
}

/** Lokale Clerk-Pakete finden: E2E_CLERK_PAKETE oder e2e/.clerk-pakete (siehe e2e/README.md) */
export function findeClerkPakete(): ClerkPakete {
  const basis = process.env.E2E_CLERK_PAKETE || path.join(__dirname, '.clerk-pakete');
  const clerkJs = path.join(basis, 'clerk-js', 'package');
  const ui = path.join(basis, 'ui', 'package');
  if (!existsSync(path.join(clerkJs, 'dist', 'clerk.browser.js')) || !existsSync(path.join(ui, 'dist', 'ui.browser.js'))) {
    throw new Error(`Clerk-Pakete fehlen unter ${basis}. Erst "npm run e2e:setup" ausführen.`);
  }
  return { clerkJs, ui };
}
