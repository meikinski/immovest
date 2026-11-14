# GTM-Anleitung: Events sauber nach GA4 bringen

Container **GTM-PRBQ2LT9**, GA4-Property **G-H4G4G4NLSN**. Ziel: ein generisches Setup statt eines Tags pro Event.

## Events, die der Code in den dataLayer schreibt

| Event | Wann | Parameter |
|---|---|---|
| `ai_import_started` | Import gestartet | `import_method`, `import_url` |
| `ai_import_completed` | Import erfolgreich | `import_method`, `import_url`, `has_warnings`, `missing_fields` |
| `ai_import_failed` | Import fehlgeschlagen | `import_method`, `import_url`, `error` |
| `kpi_result_viewed` | KPI-Ergebnis sichtbar (auch Gäste), einmal je Wohnung | `input_method`, `object_type`, `signed_in` |
| `analysis_completed` | Vollständige Analyse fertig (Markt, KI, Prognose), einmal je Wohnung | `analysis_number`, `plan` |
| `locked_preview_clicked` | Gast klickt in gesperrter Vorschau | `section`, `action` |
| `sign_up_page_viewed` | `/sign-up` geöffnet (einziges Start-Event der Registrierung) | `source`, `has_property` |
| `sign_up` | Neues Konto angelegt (nicht bei Login) | `method` |
| `paywall_viewed` | Paywall bzw. Preisbereich sichtbar | `trigger`, `source`, `signed_in`, `free_analyses_used` |
| `checkout_started` | Klick auf Bezahlen, vor der Weiterleitung zu Stripe | `plan`, `click_location`, `value`, `currency`, `founder_price` |
| `purchase` | Rückkehr von Stripe, einmal je `transaction_id` | `transaction_id`, `value`, `currency`, `items`, `subscription_plan_id`, `subscription_interval` |
| `upgrade_clicked` | Klick auf einen Plan | `plan_name`, `click_location` |
| `compare_cta_clicked` | „Zweite Wohnung prüfen" | `plan` |
| `cta_clicked` | Start-Buttons auf Startseite und Preisseite | `cta_name`, `cta_location` |

Nicht für GA4 gedacht: `ads_conversion_signup` (Google-Ads-Conversion), `signup_completed` (Altbestand, feuert parallel zu `sign_up`), `cookie_consent_update`, `set_user_properties`.

## 1. Datenschichtvariablen anlegen

Variablen → Benutzerdefinierte Variablen → Neu → Typ **Datenschichtvariable**, Version 2. Name der Variable `DLV - <name>`, Name der Datenschichtvariable exakt wie hier:

`import_method`, `has_warnings`, `missing_fields`, `input_method`, `object_type`, `signed_in`, `analysis_number`, `plan`, `source`, `has_property`, `method`, `section`, `action`, `trigger`, `free_analyses_used`, `click_location`, `plan_name`, `cta_name`, `cta_location`, `founder_price`, `value`, `currency`, `transaction_id`, `items`, `subscription_plan_id`, `subscription_interval`

Außerdem unter Variablen → Integrierte Variablen → Konfigurieren: **Event** aktivieren (falls noch nicht aktiv).

## 2. Ein Trigger für alle Events

Trigger → Neu → Typ **Benutzerdefiniertes Ereignis**.

- Name: `CE - imvestr Events`
- Ereignisname (Haken bei „Übereinstimmung mit regulärem Ausdruck verwenden"):

```
^(ai_import_started|ai_import_completed|ai_import_failed|kpi_result_viewed|analysis_completed|locked_preview_clicked|sign_up_page_viewed|sign_up|paywall_viewed|checkout_started|purchase|upgrade_clicked|compare_cta_clicked|cta_clicked)$
```

- Auslösen bei: Alle benutzerdefinierten Ereignisse.

Wichtig sind `^` und `$`: ohne sie würde `sign_up` auch auf `sign_up_page_viewed` passen.

## 3. Ein GA4-Ereignis-Tag

Tags → Neu → **Google Analytics: GA4-Ereignis**.

- Name: `GA4 - Event - generisch`
- Mess-ID: `G-H4G4G4NLSN` (oder die Variable deines Google-Tags)
- Ereignisname: `{{Event}}`
- Ereignisparameter: je Zeile Parametername = Name aus Schritt 1, Wert = `{{DLV - <name>}}`. Alle 26 eintragen. Leere Werte sendet GTM nicht mit.
- Trigger: `CE - imvestr Events`

Hinweis: Der dataLayer merkt sich Werte. Ein Parameter aus einem früheren Event (z. B. `plan`) kann an einem späteren Event hängen, das ihn selbst nicht setzt. Für die Auswertung reicht es, pro Event nur die Parameter aus der Tabelle oben zu lesen.

## 4. Der Tag, der „cta_clicked" sendet

Der Code sendet `analysis_completed` unter seinem eigenen Namen. Die Umbenennung passiert im Container. So findest du den Tag:

1. Tags öffnen, oben rechts die Suche: `cta_clicked`. Gesucht ist ein GA4-Ereignis-Tag, dessen **Ereignisname fest `cta_clicked`** lautet (kein `{{Event}}`).
2. Dessen Trigger öffnen. Wahrscheinlich ist es ein benutzerdefiniertes Ereignis mit Regex oder „enthält", das neben `cta_clicked` auch `analysis_completed` erfasst, oder ein zweiter Trigger wurde später an denselben Tag gehängt.
3. Diesen Tag **pausieren oder löschen**. `cta_clicked` läuft danach über den generischen Tag aus Schritt 3. Bleibt der alte Tag aktiv, kommt `cta_clicked` doppelt an.
4. Genauso alle anderen GA4-Ereignis-Tags mit festem Namen prüfen (z. B. für `ai_import_started`, `ai_import_completed`) und pausieren, sonst zählen diese Events doppelt.
5. Den Google-Ads-Conversion-Tag auf `ads_conversion_signup` nicht anfassen.

## 5. In GA4 registrieren

Verwaltung → Datenanzeige → **Benutzerdefinierte Definitionen** → Benutzerdefinierte Dimension erstellen, Umfang jeweils **Ereignis**:

`input_method`, `object_type`, `signed_in`, `plan`, `source`, `method`, `section`, `trigger`, `import_method`, `has_warnings`, `missing_fields`, `click_location`, `cta_name`, `cta_location`, `has_property`

Als **benutzerdefinierter Messwert** (Umfang Ereignis, Einheit Standard): `analysis_number`, `free_analyses_used`.

`value`, `currency`, `transaction_id` und `items` sind GA4-Standardfelder und brauchen keine Registrierung.

Verwaltung → Datenanzeige → **Ereignisse** → Stern bei `sign_up` und `purchase` setzen (Schlüsselereignisse). Erscheinen sie noch nicht in der Liste: „Ereignis erstellen" ist nicht nötig, unter „Schlüsselereignisse" → „Neues Schlüsselereignis" den Namen von Hand eintragen.

## 6. Prüfen

**GTM-Vorschau**

1. In GTM auf „Vorschau", `https://imvestr.de` eingeben, verbinden.
2. Ablauf durchklicken: Startseite → Link importieren → vier Schritte → Ergebnis → „Kostenlos freischalten".
3. Links in der Ereignisliste müssen nacheinander erscheinen: `cta_clicked`, `ai_import_started`, `ai_import_completed`, `kpi_result_viewed`, `locked_preview_clicked` bzw. `sign_up_page_viewed`.
4. Jedes Event anklicken → Tab „Tags": **genau ein** Tag ausgelöst, nämlich `GA4 - Event - generisch`. Zwei ausgelöste GA4-Tags bedeuten, dass ein alter Tag noch aktiv ist.
5. Den Tag anklicken: Ereignisname muss dem dataLayer-Event entsprechen, die Parameter müssen gefüllt sein.
6. Mit einem Testkonto registrieren: `sign_up` erscheint einmal mit `method`. Danach Marktvergleich öffnen: `analysis_completed` erscheint erst, wenn die Marktanalyse geladen ist, mit `analysis_number: 1` und `plan: free`.
7. Testkauf (Stripe-Testmodus bzw. Gutschein): `checkout_started`, nach der Rückkehr einmal `purchase`. Seite neu laden: `purchase` darf kein zweites Mal kommen.

**GA4 DebugView**

Verwaltung → Datenanzeige → DebugView. Solange die GTM-Vorschau läuft, erscheint dein Gerät dort. Dieselben Events müssen mit denselben Namen ankommen, `analysis_completed` nicht mehr als `cta_clicked`. Ein Klick auf ein Event zeigt die Parameter. Benutzerdefinierte Dimensionen sind in Berichten erst nach 24 bis 48 Stunden sichtbar, in der DebugView sofort.

Wenn alles stimmt: in GTM **Senden** → Version veröffentlichen.
