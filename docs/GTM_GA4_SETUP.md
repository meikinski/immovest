# GTM-Anleitung: Events sauber nach GA4 bringen

Container **GTM-PRBQ2LT9**, GA4-Property **G-H4G4G4NLSN**.

Ziel: **ein** Trigger und **ein** GA4-Tag für alle Events, statt eines Tags pro Event. Neue Events kommen später nur noch in die Regex.

Reihenfolge: Schritte 1 bis 4 in GTM, Schritt 5 in GA4, Schritt 6 prüfen, erst dann in GTM veröffentlichen und den Filter für internen Traffic aktivieren.

---

## 0. Was der Code in den dataLayer schreibt

Alle Events laufen über einen zentralen Helper (`src/lib/analytics.ts`). Er hängt bei internen Nutzern `traffic_type: "internal"` an und setzt vor jedem Event alle Parameter des vorigen Events zurück. Darum hängt z. B. `plan` aus einem früheren Event nicht mehr an einem späteren.

| Event | Wann | Parameter |
|---|---|---|
| `ai_import_started` | Import per Link oder Screenshot gestartet | `import_method`, `import_domain` |
| `ai_import_completed` | Import erfolgreich | `import_method`, `import_domain`, `has_warnings`, `missing_fields` |
| `ai_import_failed` | Import fehlgeschlagen | `import_method`, `import_domain`, `error` |
| `review_page_viewed` | Prüfseite nach Import (Link oder Foto) geöffnet | `input_method`, `missing_fields_count` |
| `kpi_result_viewed` | KPI-Ergebnis sichtbar (auch für Gäste), einmal je Wohnung | `input_method`, `object_type`, `signed_in` |
| `analysis_completed` | Vollständige Analyse fertig (Markt, KI, Prognose), einmal je Wohnung | `analysis_number`, `plan` |
| `locked_preview_clicked` | Gast klickt auf eine gesperrte Vorschau | `section`, `action` |
| `compare_cta_clicked` | Klick auf „Zweite Wohnung prüfen“ | `plan` |
| `analysis_saved` | Analyse im Konto gespeichert | `save_type` (`manual` / `auto`), `plan` |
| `pdf_downloaded` | PDF-Report heruntergeladen (nach erfolgreichem Export) | `plan` |
| `sign_up_page_viewed` | `/sign-up` geöffnet | `source`, `has_property` |
| `sign_up` | Neues Konto angelegt (kein Login) | `method` |
| `paywall_viewed` | Paywall bzw. Preisbereich sichtbar | `trigger`, `source`, `signed_in`, `free_analyses_used` |
| `upgrade_clicked` | Klick auf einen Plan | `plan_name`, `click_location` |
| `checkout_started` | Klick auf Bezahlen, vor der Weiterleitung zu Stripe | `plan`, `value`, `currency`, `click_location`, `founder_price` |
| `purchase` | Rückkehr von Stripe, einmal je `transaction_id` | `transaction_id`, `value`, `currency`, `plan`, `items`, `subscription_plan_id`, `subscription_interval` |
| `cta_clicked` | Start-Buttons auf Startseite und Preisseite | `cta_name`, `cta_location` |

Zusätzlich an jedem Event bei internen Nutzern: `traffic_type` = `internal`.

Nicht für GA4 gedacht (nicht in die Regex aufnehmen): `ads_conversion_signup` (Google-Ads-Conversion), `signup_completed` (Altbestand, parallel zu `sign_up`), `cookie_consent_update`.

`signup_initiated` gibt es im Code nicht mehr. Falls in GTM noch etwas darauf wartet: löschen.

---

## 1. Datenschichtvariablen anlegen

1. GTM öffnen → Arbeitsbereich → **Variablen**.
2. Unter **Integrierte Variablen** → **Konfigurieren** → Haken bei **Event** setzen (falls noch nicht aktiv).
3. Unter **Benutzerdefinierte Variablen** → **Neu** → Variablenkonfiguration → **Datenschichtvariable**.
   - Name der Datenschichtvariable: exakt der Parametername (z. B. `plan`)
   - Version der Datenschicht: **Version 2**
   - Standardwert: nicht setzen
   - Variablenname oben links: `DLV - plan`
4. Speichern und für jeden der folgenden Namen wiederholen:

```
import_method, import_domain, has_warnings, missing_fields, error,
input_method, object_type, signed_in,
analysis_number, plan, save_type,
section, action,
source, has_property, method,
trigger, free_analyses_used,
plan_name, click_location, founder_price,
value, currency, transaction_id, items, subscription_plan_id, subscription_interval,
cta_name, cta_location,
traffic_type
```

Tipp: Eine Variable fertig anlegen, dann in der Liste über die drei Punkte **Kopieren** und nur die zwei Namen ändern. Das geht schneller.

---

## 2. Ein Trigger für alle Events

1. **Trigger** → **Neu** → Triggerkonfiguration → **Benutzerdefiniertes Ereignis**.
2. Name: `CE - imvestr Events`
3. Ereignisname:

```
^(ai_import_started|ai_import_completed|ai_import_failed|review_page_viewed|kpi_result_viewed|analysis_completed|locked_preview_clicked|compare_cta_clicked|analysis_saved|pdf_downloaded|sign_up_page_viewed|sign_up|paywall_viewed|upgrade_clicked|checkout_started|purchase|cta_clicked)$
```

4. Haken bei **Übereinstimmung mit regulärem Ausdruck verwenden**.
5. Auslösen bei: **Alle benutzerdefinierten Ereignisse**.
6. Speichern.

Wichtig sind `^` und `$`. Ohne sie passt `sign_up` auch auf `sign_up_page_viewed`, und es gäbe doppelte Treffer.

---

## 3. Ein GA4-Ereignis-Tag

1. **Tags** → **Neu** → Tag-Konfiguration → **Google Analytics** → **Google Analytics: GA4-Ereignis**.
2. Name: `GA4 - Event - generisch`
3. Mess-ID: `G-H4G4G4NLSN`. Falls es schon einen Google-Tag mit dieser ID im Container gibt, reicht das. Sonst zusätzlich einen **Google-Tag** mit `G-H4G4G4NLSN` auf **Initialisierung – Alle Seiten** anlegen.
4. Ereignisname: `{{Event}}` (über das Baustein-Symbol auswählen, nicht von Hand tippen).
5. **Ereignisparameter** → **Zeile hinzufügen**. Für jede Variable aus Schritt 1 eine Zeile:
   - Ereignisparameter: `plan`
   - Wert: `{{DLV - plan}}`

   Alle 30 Zeilen eintragen, auch `traffic_type` (sonst greift der Filter für internen Traffic nicht). Leere Werte sendet GTM nicht mit. Deshalb kommt kein Event über das GA4-Limit von 25 Parametern.
6. Trigger: `CE - imvestr Events`.
7. Speichern.

---

## 4. Den Tag finden und reparieren, der „cta_clicked“ sendet

**Was der Code macht:** `analysis_completed` wird im Code unter genau diesem Namen in den dataLayer geschrieben (`src/lib/analytics.ts`, `meldeAnalyseAbgeschlossen`). Der Code sendet `cta_clicked` aber auch, nämlich bei Klicks auf Start-Buttons (Startseite und Preisseite). Dass `analysis_completed` in GA4 als `cta_clicked` ankommt, liegt also am Container. Der Code benennt nichts um.

So findest du den Tag:

1. In GTM **Tags** öffnen und oben rechts auf die **Lupe** klicken. Suchbegriff: `cta_clicked`.
2. Gesucht ist ein **GA4-Ereignis-Tag**, dessen Feld **Ereignisname fest `cta_clicked`** enthält (also kein `{{Event}}`).
3. Den Tag öffnen und unten auf den **Trigger** schauen. Typische Ursachen:
   - Ein benutzerdefiniertes Ereignis mit Regex oder „enthält“, das neben `cta_clicked` auch `analysis_completed` erfasst.
   - Ein zweiter Trigger (z. B. „CE - analysis_completed“), der später an diesen Tag gehängt wurde.
   - Ein Trigger vom Typ „Alle benutzerdefinierten Ereignisse“ ohne Bedingung.
4. Diesen Tag **pausieren** (drei Punkte → Pausieren) oder **löschen**. `cta_clicked` und `analysis_completed` laufen danach beide über den generischen Tag aus Schritt 3, jeweils unter ihrem eigenen Namen.
5. Danach alle **anderen GA4-Ereignis-Tags mit festem Namen** durchgehen, z. B. für `ai_import_started` oder `ai_import_completed`, und pausieren. Bleiben sie aktiv, zählen diese Events doppelt (einmal alt, einmal generisch).
6. Nicht anfassen: den Google-Ads-Conversion-Tag auf `ads_conversion_signup` und den Google-Tag (Konfiguration).

Wenn die Suche nichts findet: In der GTM-Vorschau (Schritt 6) das Event `analysis_completed` anklicken → Tab **Tags** → dort steht unter „Ausgelöste Tags“ der Name des Tags, der feuert.

Hinweis für die Auswertung: Alte `cta_clicked`-Zahlen in GA4 enthalten bis zur Veröffentlichung auch abgeschlossene Analysen. Für Vergleiche erst ab dem Veröffentlichungsdatum auswerten.

---

## 5. In GA4 einrichten

### 5a. Benutzerdefinierte Dimensionen

GA4 → **Verwaltung** (Zahnrad) → Datenanzeige → **Benutzerdefinierte Definitionen** → **Benutzerdefinierte Dimension erstellen**. Umfang jeweils **Ereignis**, Ereignisparameter = Name, Dimensionsname gleichlautend:

```
input_method, object_type, signed_in, plan, save_type,
section, action, source, has_property, method,
trigger, import_method, import_domain, has_warnings, missing_fields,
click_location, plan_name, cta_name, cta_location, founder_price
```

### 5b. Benutzerdefinierte Messwerte

Gleicher Ort, Reiter **Benutzerdefinierte Messwerte** → Erstellen, Umfang **Ereignis**, Maßeinheit **Standard**:

```
analysis_number, free_analyses_used
```

`value`, `currency`, `transaction_id` und `items` sind GA4-Standardfelder und brauchen keine Registrierung. `traffic_type` wird nicht registriert, das nutzt nur der Filter.

### 5c. Schlüsselereignisse

Verwaltung → Datenanzeige → **Schlüsselereignisse** → **Neues Schlüsselereignis**:

- `sign_up`
- `purchase`

Alternativ unter Verwaltung → **Ereignisse** den Schalter „Als Schlüsselereignis markieren“ setzen, sobald die Events dort erscheinen.

### 5d. Filter für internen Traffic

Der Code setzt `traffic_type = internal` für alle Konten, deren bestätigte E-Mail in der Umgebungsvariable `INTERNAL_USER_EMAILS` steht (Vercel → Project → Settings → Environment Variables, kommagetrennt, dann neu deployen). Ein so erkanntes Gerät bleibt intern, auch abgemeldet. Zum Zurücksetzen im Browser den localStorage-Eintrag `analytics_internal_device` löschen.

1. GA4 → Verwaltung → Datenerhebung und -änderung → **Datenfilter**.
2. Es gibt meist schon einen Filter **Internal Traffic**. Öffnen (sonst: Filter erstellen → **Interner Traffic**).
3. Prüfen: Vorgang **Ausschließen**, Parameterwert **`internal`** (genau so geschrieben wie im Code).
4. Status zuerst auf **Wird getestet** lassen.
5. Erst nach Schritt 6 auf **Aktiv** stellen. Ab dann landen interne Events nicht mehr in den Berichten. Ein aktiver Filter wirkt nur auf neue Daten, nicht rückwirkend.

Die IP-basierte Regel unter Datenstreams → Tag-Einstellungen → „Internen Traffic definieren“ ist dafür nicht nötig. Der Parameter kommt direkt aus dem Code.

---

## 6. Prüfen

### GTM-Vorschau

1. In GTM oben rechts **Vorschau** → `https://imvestr.de` eingeben → **Connect**. Tag Assistant öffnet die Seite in einem neuen Tab.
2. Ablauf als Gast durchklicken: Startseite → „Analyse starten“ → Link importieren → Prüfseite → Ergebnis → gesperrte Vorschau anklicken.
3. Links in Tag Assistant müssen nacheinander erscheinen:
   `cta_clicked` → `ai_import_started` → `ai_import_completed` → `review_page_viewed` → `kpi_result_viewed` → `locked_preview_clicked` → `sign_up_page_viewed`.
4. Jedes Event anklicken → Reiter **Tags**: unter „Tags Fired“ steht **genau ein** GA4-Tag, nämlich `GA4 - Event - generisch`. Zwei ausgelöste GA4-Tags bedeuten, dass noch ein alter Tag aktiv ist (Schritt 4).
5. Den Tag anklicken: Der Ereignisname muss dem dataLayer-Event entsprechen, die Parameter müssen gefüllt sein.
6. Reiter **Data Layer** beim selben Event: Parameter früherer Events stehen dort als `undefined`. Das ist gewollt.
7. Mit einem neuen Testkonto registrieren: `sign_up` erscheint **einmal** mit `method`. Abmelden und wieder anmelden: `sign_up` darf **nicht** erneut kommen.
8. Ergebnis öffnen und warten, bis Marktvergleich und KI-Einschätzung geladen sind: erst dann `analysis_completed` mit `analysis_number: 1` und `plan: free`. Kurz darauf `analysis_saved` mit `save_type: auto`.
9. „Analyse speichern“ klicken: `analysis_saved` mit `save_type: manual`. PDF herunterladen: `pdf_downloaded`.
10. Paywall öffnen: `paywall_viewed` mit `trigger`. Plan wählen: `upgrade_clicked`, `checkout_started` mit `plan`, `value`, `currency`.
11. Testkauf (Stripe-Testmodus bzw. Gutschein): nach der Rückkehr einmal `purchase`. Seite neu laden: `purchase` darf kein zweites Mal kommen.
12. Mit einem Konto aus `INTERNAL_USER_EMAILS` anmelden: An jedem Event steht im Tag unter den Parametern `traffic_type: internal`. Mit einem anderen Konto (anderer Browser, ohne Gerät-Markierung) fehlt der Parameter.

### GA4 DebugView

1. GA4 → Verwaltung → Datenanzeige → **DebugView**. Solange die GTM-Vorschau läuft, erscheint dein Gerät oben links in der Geräteauswahl.
2. Dieselben Events müssen mit denselben Namen ankommen. `analysis_completed` darf **nicht** mehr als `cta_clicked` erscheinen.
3. Event anklicken → Parameter prüfen (`plan`, `source`, `method`, `transaction_id`, `value` usw.).
4. Bei einem internen Konto: Parameter `traffic_type = internal` sichtbar. Solange der Filter auf „Wird getestet“ steht, siehst du diese Events noch.
5. Benutzerdefinierte Dimensionen erscheinen in normalen Berichten erst nach 24 bis 48 Stunden, in der DebugView sofort.

### Veröffentlichen

1. GTM → **Senden** → Versionsname z. B. „Generisches GA4-Event-Setup, cta_clicked-Tag entfernt“ → **Veröffentlichen**.
2. In GA4 den Filter **Internal Traffic** auf **Aktiv** stellen.
3. Am nächsten Tag unter Berichte → Echtzeit bzw. Ereignisse prüfen, dass `analysis_completed`, `sign_up_page_viewed` und `sign_up` ankommen.

---

## Hinweise

- **purchase kommt zweimal an, wird aber einmal gezählt:** Der Browser sendet `purchase` nach der Rückkehr von Stripe, der Stripe-Webhook sendet es zusätzlich serverseitig (Measurement Protocol, falls `GA4_MEASUREMENT_ID` und `GA4_API_SECRET` gesetzt sind). Beide nutzen dieselbe `transaction_id` (Stripe-Session-ID) und, wenn verfügbar, dieselbe `client_id`. GA4 dedupliziert Käufe über die `transaction_id`.
- **Keine personenbezogenen Daten:** Events enthalten weder E-Mail noch Name noch User-ID. Vom Import geht nur die Domain mit (`import_domain`), nicht der vollständige Link.
- **Einwilligung:** Aktuell lädt GTM ohne Cookie-Banner und ohne Consent Mode. Das ist ein eigenes Thema (siehe PR-Beschreibung) und unabhängig von dieser Anleitung zu lösen.
