import { deDE } from '@clerk/localizations';

/**
 * Clerk-Texte für imvestr: Du-Form, „Anmelden" statt „Einloggen", Marke klein geschrieben.
 * Basis ist die deutsche Clerk-Übersetzung (Sie-Form). Alles, was Nutzer beim Registrieren und Anmelden
 * sehen, ist hier von Hand überschrieben. Selten gezeigte Texte (Organisationen, API-Keys) bleiben wie geliefert.
 */

type Texte = { [key: string]: string | Texte | undefined };

/** Marke und „Einloggen" in allen gelieferten Texten ersetzen */
function anpassen(wert: unknown): unknown {
  if (typeof wert === 'string') {
    return wert
      .replace(/\{\{\s*applicationName\s*\}\}/g, 'imvestr')
      .replace(/Einloggen/g, 'Anmelden')
      .replace(/einloggen/g, 'anmelden');
  }
  if (Array.isArray(wert)) return wert.map(anpassen);
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, anpassen(v)]));
  }
  return wert;
}

function zusammenfuehren(basis: Texte, neu: Texte): Texte {
  const aus: Texte = { ...basis };
  for (const [k, v] of Object.entries(neu)) {
    const alt = aus[k];
    aus[k] = v && typeof v === 'object' && alt && typeof alt === 'object' ? zusammenfuehren(alt, v) : v;
  }
  return aus;
}

const WEITER = 'weiter zu imvestr';

const DU_FORM: Texte = {
  formButtonPrimary: 'Weiter',
  formButtonPrimary__verify: 'Bestätigen',
  formFieldInputPlaceholder__emailAddress: 'E-Mail-Adresse eingeben',
  formFieldInputPlaceholder__password: 'Passwort eingeben',
  formFieldInputPlaceholder__signUpPassword: 'Passwort wählen',
  footerActionLink__useAnotherMethod: 'Andere Methode verwenden',
  formFieldError__verificationLinkExpired: 'Der Bestätigungslink ist abgelaufen. Bitte fordere einen neuen an.',
  signInEnterPasswordTitle: 'Gib dein Passwort ein',
  signUp: {
    start: {
      title: 'Erstelle dein Konto',
      titleCombined: 'Erstelle dein Konto',
      subtitle: WEITER,
      subtitleCombined: WEITER,
      actionText: 'Schon ein Konto?',
      actionLink: 'Anmelden',
      actionLink__use_email: 'Mit E-Mail registrieren',
      actionLink__use_phone: 'Mit Telefonnummer registrieren',
    },
    continue: {
      title: 'Ergänze die fehlenden Angaben',
      subtitle: WEITER,
      actionText: 'Schon ein Konto?',
      actionLink: 'Anmelden',
    },
    emailCode: {
      title: 'Bestätige deine E-Mail',
      subtitle: WEITER,
      formTitle: 'Bestätigungscode',
      formSubtitle: 'Gib den Code ein, den wir an deine E-Mail-Adresse geschickt haben',
      resendButton: 'Keinen Code erhalten? Erneut senden',
    },
    emailLink: {
      title: 'Bestätige deine E-Mail',
      subtitle: WEITER,
      formSubtitle: 'Klick auf den Bestätigungslink, den wir an deine E-Mail-Adresse geschickt haben',
      verifiedSwitchTab: {
        subtitle: 'Geh zurück zum neu geöffneten Tab, um fortzufahren',
        subtitleNewTab: 'Geh zurück zum vorherigen Tab, um fortzufahren',
      },
    },
    legalConsent: { continue: { subtitle: 'Bitte lies und akzeptiere die Bedingungen, um fortzufahren' } },
    restrictedAccess: { subtitle: 'Dein Zugang ist momentan eingeschränkt.' },
  },
  signIn: {
    start: {
      title: 'Bei imvestr anmelden',
      titleCombined: 'Weiter zu imvestr',
      subtitle: 'Willkommen zurück! Melde dich an, um fortzufahren',
      subtitleCombined: 'Willkommen zurück! Melde dich an, um fortzufahren',
      actionText: 'Noch kein Konto?',
      actionLink: 'Registrieren',
    },
    password: {
      title: 'Gib dein Passwort ein',
      subtitle: 'Gib das Passwort für dein Konto ein',
      actionLink: 'Andere Methode verwenden',
    },
    emailCode: {
      title: 'Schau in dein Postfach',
      subtitle: WEITER,
      formTitle: 'Bestätigungscode',
      resendButton: 'Keinen Code erhalten? Erneut senden',
    },
    emailCodeMfa: { title: 'Schau in dein Postfach', formTitle: 'Bestätigungscode', subtitle: WEITER },
    emailLink: {
      title: 'Schau in dein Postfach',
      subtitle: WEITER,
      formSubtitle: 'Klick auf den Bestätigungslink, den wir an deine E-Mail-Adresse geschickt haben',
      expired: { subtitle: 'Geh zurück zum ursprünglichen Tab, um fortzufahren.' },
      failed: { subtitle: 'Geh zurück zum ursprünglichen Tab, um fortzufahren.' },
      loading: { title: 'Anmeldung läuft …', subtitle: 'Du wirst gleich weitergeleitet' },
      verified: { subtitle: 'Du wirst gleich weitergeleitet' },
      unusedTab: { title: 'Du kannst diesen Tab schließen' },
      verifiedSwitchTab: {
        subtitle: 'Geh zurück zum ursprünglichen Tab, um fortzufahren',
        subtitleNewTab: 'Geh zurück zum neu geöffneten Tab, um fortzufahren',
      },
    },
    emailLinkMfa: {
      title: 'Schau in dein Postfach',
      subtitle: WEITER,
      formSubtitle: 'Klick auf den Bestätigungslink, den wir an deine E-Mail-Adresse geschickt haben',
    },
    forgotPassword: {
      resendButton: 'Keinen Code erhalten? Erneut senden',
      subtitle_email: 'Gib zuerst den Code ein, den wir an deine E-Mail-Adresse geschickt haben',
      subtitle_phone: 'Gib zuerst den Code ein, den wir an dein Handy geschickt haben',
    },
    forgotPasswordAlternativeMethods: { label__alternativeMethods: 'Oder melde dich mit einer anderen Methode an' },
    alternativeMethods: {
      title: 'Andere Methode verwenden',
      subtitle: 'Probleme? Du kannst dich auch mit einer dieser Methoden anmelden.',
      actionText: 'Keine davon passt?',
      blockButton__password: 'Mit deinem Passwort anmelden',
      blockButton__passkey: 'Mit deinem Passkey anmelden',
      blockButton__totp: 'Authentifizierungs-App verwenden',
      blockButton__backupCode: 'Wiederherstellungscode verwenden',
      getHelp: {
        content: 'Wenn du dich nicht anmelden kannst, schreib uns eine E-Mail. Wir helfen dir, so schnell wie möglich wieder Zugriff zu bekommen.',
      },
    },
    accountSwitcher: { title: 'Wähle ein Konto', subtitle: 'Wähle das Konto, mit dem du fortfahren möchtest.' },
    newDeviceVerificationNotice: 'Du meldest dich von einem neuen Gerät an. Zur Sicherheit bitten wir dich um eine Bestätigung.',
    resetPassword: {
      requiredMessage: 'Aus Sicherheitsgründen musst du dein Passwort zurücksetzen.',
      successMessage: 'Dein Passwort wurde geändert. Einen Moment, du wirst angemeldet.',
    },
    resetPasswordMfa: { detailsLabel: 'Bevor wir dein Passwort zurücksetzen, müssen wir deine Identität prüfen.' },
    passkey: {
      title: 'Verwende deinen Passkey',
      subtitle: 'Mit deinem Passkey bestätigst du, dass du es bist. Dein Gerät fragt eventuell nach Fingerabdruck, Gesicht oder Bildschirmsperre.',
    },
    totpMfa: { subtitle: 'Gib zum Fortfahren den Code aus deiner Authenticator-App ein.' },
  },
  unstable__errors: {
    captcha_invalid: 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuch es erneut oder schreib uns.',
    captcha_unavailable: 'Die Sicherheitsprüfung konnte nicht geladen werden. Bitte lade die Seite neu oder schreib uns.',
    form_code_incorrect: 'Der Code ist falsch. Bitte prüf ihn und versuch es erneut.',
    form_email_address_blocked: 'Wegwerf-Adressen werden nicht unterstützt. Bitte nimm deine normale E-Mail-Adresse.',
    form_identifier_exists__email_address: 'Zu dieser E-Mail-Adresse gibt es schon ein Konto. Melde dich an oder nimm eine andere Adresse.',
    form_param_format_invalid__email_address: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    form_param_type_invalid__email_address: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    form_param_nil: 'Ein Pflichtfeld ist leer. Bitte prüf deine Eingaben.',
    form_password_or_identifier_incorrect: 'Passwort oder E-Mail-Adresse ist falsch. Versuch es erneut oder nimm eine andere Methode.',
    form_password_pwned: 'Dieses Passwort ist in einem Datenleck aufgetaucht. Bitte wähle ein anderes.',
    form_password_pwned__sign_in: 'Dieses Passwort ist in einem Datenleck aufgetaucht und kann nicht verwendet werden. Bitte setz dein Passwort zurück.',
    not_allowed_access: 'Mit dieser E-Mail-Adresse ist keine Anmeldung möglich. Bitte nimm eine andere Adresse oder schreib uns.',
    session_exists: 'Du bist bereits angemeldet.',
    zxcvbn: {
      couldBeStronger: 'Dein Passwort funktioniert, könnte aber stärker sein. Nimm ein paar Zeichen mehr.',
      goodPassword: 'Dein Passwort erfüllt alle Anforderungen.',
      notEnough: 'Dein Passwort ist nicht stark genug.',
      suggestions: { pwned: 'Wenn du dieses Passwort woanders verwendest, solltest du es ändern.' },
      warnings: { pwned: 'Dein Passwort ist in einem Datenleck aufgetaucht.' },
    },
  },
};

export const clerkLokalisierung = zusammenfuehren(anpassen(deDE) as Texte, DU_FORM) as typeof deDE;
