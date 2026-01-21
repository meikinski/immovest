# 📊 Google Analytics & Tag Manager Setup für AI-Agent Integration

Vollständige Anleitung zur Einrichtung von Google Tag Manager (GTM) und Google Analytics 4 (GA4) für ImVestr - optimiert für AI-gesteuerte Datenanalyse.

---

## 🎯 Warum GTM + GA4?

- **AI-Agent Ready**: Strukturierte Events perfekt für maschinelle Auswertung
- **Custom Events**: Tracken Sie jeden wichtigen User-Touchpoint
- **Multiple Datenquellen**: GTM ermöglicht einfache Integration weiterer Tools
- **Google Analytics Data API**: Direkter Zugriff für AI-Agents auf alle Metriken

---

## 📋 Teil 1: Google Tag Manager (GTM) einrichten

### Schritt 1: GTM Account erstellen

1. Gehen Sie zu: https://tagmanager.google.com
2. Klicken Sie auf **"Konto erstellen"**
3. Geben Sie ein:
   - **Kontoname**: ImVestr
   - **Land**: Deutschland
   - **Container-Name**: immovestr.de
   - **Zielplattform**: Web
4. Akzeptieren Sie die Nutzungsbedingungen
5. **Kopieren Sie Ihre Container-ID** (Format: `GTM-XXXXXXX`)

### Schritt 2: GTM ID in Vercel eintragen

1. Gehen Sie zu Ihrem Vercel-Projekt: https://vercel.com/meikinski/immovest
2. Navigieren Sie zu **Settings → Environment Variables**
3. Fügen Sie hinzu:
   ```
   Name: NEXT_PUBLIC_GTM_ID
   Value: GTM-XXXXXXX (Ihre echte ID)
   Environment: Production, Preview, Development
   ```
4. Klicken Sie auf **"Save"**
5. **Deployment auslösen**: Gehen Sie zu **Deployments** → **"Redeploy"**

### Schritt 3: GTM Container konfigurieren

**Wichtig**: Sie müssen NICHTS im GTM Container selbst konfigurieren! Die Events werden automatisch über den `dataLayer` gesendet.

Optional können Sie im GTM Dashboard:
- **Tags**: Google Analytics 4 Configuration Tag hinzufügen
- **Trigger**: All Pages
- **Variables**: Custom Event-Parameter definieren

---

## 📊 Teil 2: Google Analytics 4 (GA4) einrichten

### Schritt 1: GA4 Property erstellen

1. Gehen Sie zu: https://analytics.google.com
2. Klicken Sie auf **"Verwaltung"** (Zahnrad unten links)
3. Klicken Sie auf **"Property erstellen"**
4. Geben Sie ein:
   - **Property-Name**: ImVestr
   - **Zeitzone**: Deutschland
   - **Währung**: EUR
5. Wählen Sie Branche: **Finanzen**
6. Unternehmensgröße: Je nach Bedarf
7. Klicken Sie auf **"Erstellen"**

### Schritt 2: Datenstream erstellen

1. Nach der Property-Erstellung: **"Datenstream hinzufügen"**
2. Wählen Sie **"Web"**
3. Geben Sie ein:
   - **Website-URL**: https://immovestr.de
   - **Stream-Name**: ImVestr Production
4. **"Enhanced Measurement"** aktivieren (empfohlen)
5. Klicken Sie auf **"Stream erstellen"**
6. **Kopieren Sie die Measurement ID** (Format: `G-XXXXXXXXXX`)

### Schritt 3: GA4 mit GTM verbinden

**Option A: Via GTM Dashboard** (Empfohlen)

1. In GTM: **Tags → Neu**
2. Tag-Typ: **Google Analytics: GA4-Konfiguration**
3. Measurement-ID: `G-XXXXXXXXXX` (Ihre GA4 ID)
4. Trigger: **All Pages**
5. Speichern & **Container veröffentlichen**

**Option B: Via Environment Variable** (bereits vorbereitet)

1. In Vercel: **Settings → Environment Variables**
2. Fügen Sie hinzu:
   ```
   Name: NEXT_PUBLIC_GA4_MEASUREMENT_ID
   Value: G-XXXXXXXXXX
   Environment: Production, Preview, Development
   ```

---

## 🔧 Teil 3: Custom Dimensions für Event-Parameter einrichten

**⚠️ WICHTIG**: Damit die URLs von fehlgeschlagenen AI-Imports in GA4 angezeigt werden, müssen Sie die Event-Parameter als **Custom Dimensions** registrieren!

### Warum Custom Dimensions?

GA4 sendet alle Event-Parameter automatisch, aber sie werden **NICHT in Berichten angezeigt**, bis Sie sie als Custom Dimensions registrieren. Das betrifft besonders:

- ✅ `import_url` - Die URL bei AI-Import (Start/Erfolg/Fehler)
- ✅ `error` - Fehlermeldung bei fehlgeschlagenen Imports
- ✅ `import_method` - Methode (url/screenshot)
- ✅ `has_warnings` - Ob Warnungen aufgetreten sind

### Schritt-für-Schritt Anleitung

#### 1. Custom Dimensions erstellen

1. **GA4 öffnen**: https://analytics.google.com
2. **Verwaltung** (Zahnrad unten links) → **Custom Definitions** → **Custom Dimensions**
3. Klicken Sie auf **"Benutzerdefinierte Dimension erstellen"**

#### 2. Dimension: import_url (KRITISCH für Fehler-URLs!)

```
Dimensionsname:     Import URL
Umfang:             Ereignis
Ereignisparameter:  import_url
Beschreibung:       URL der fehlgeschlagenen/erfolgreichen AI-Imports
```

**✅ Nach dem Speichern**: Diese Dimension ist ab sofort in allen Berichten verfügbar

#### 3. Dimension: error (Fehlermeldungen)

```
Dimensionsname:     Import Error
Umfang:             Ereignis
Ereignisparameter:  error
Beschreibung:       Fehlermeldung bei fehlgeschlagenen AI-Imports
```

#### 4. Dimension: import_method

```
Dimensionsname:     Import Method
Umfang:             Ereignis
Ereignisparameter:  import_method
Beschreibung:       Methode des Imports (url oder screenshot)
```

#### 5. Dimension: has_warnings

```
Dimensionsname:     Has Warnings
Umfang:             Ereignis
Ereignisparameter:  has_warnings
Beschreibung:       Ob der Import Warnungen generiert hat
```

### So sehen Sie die URLs von fehlgeschlagenen Imports

#### Option A: Explorations (empfohlen)

1. **GA4 → Erkunden (Explore)**
2. **Neue Exploration erstellen** → **Freiform (Free form)**
3. **Dimensions hinzufügen**:
   - Event name
   - Import URL (Ihre neue Custom Dimension)
   - Import Error (Ihre neue Custom Dimension)
   - Import Method
4. **Metric hinzufügen**: Event count
5. **Filter setzen**: Event name = `ai_import_failed`

**Ergebnis**: Sie sehen jetzt eine Tabelle mit:
- Welche URLs fehlgeschlagen sind
- Wie oft jede URL fehlgeschlagen ist
- Die genaue Fehlermeldung
- Die Import-Methode

#### Option B: Realtime Report (für Live-Debugging)

1. **GA4 → Berichte → Echtzeit**
2. Scrollen Sie zu **"Ereignis nach Name"**
3. Klicken Sie auf **`ai_import_failed`**
4. Dort sehen Sie jetzt die Parameter:
   - import_url
   - error
   - import_method

### Custom Report für AI-Import Analyse

Erstellen Sie einen Custom Report für AI-Import Monitoring:

```
Name: AI Import Performance
Dimensions:
  - Event name
  - Import Method
  - Import URL
  - Import Error

Metrics:
  - Event count

Filters:
  - Event name starts with "ai_import"

Breakdown:
  1. Nach Event name (started/completed/failed)
  2. Nach Import Method (url/screenshot)
  3. Nach Import URL (bei Fehlern)
```

### Beispiel-Query für fehlgeschlagene URLs

Nach der Einrichtung können Sie in GA4 Explorations folgendes analysieren:

**Frage**: Welche URLs schlagen am häufigsten fehl?

```
Dimensions: Import URL, Import Error
Metrics: Event count
Filter: Event name = ai_import_failed
Sort: Event count (descending)
```

**Frage**: Welche Fehler treten am häufigsten auf?

```
Dimensions: Import Error, Import Method
Metrics: Event count
Filter: Event name = ai_import_failed
Sort: Event count (descending)
```

---

## ✅ Teil 4: Testen der Installation

### Lokales Testen

1. Erstellen Sie `.env.local`:
   ```bash
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

2. Starten Sie den Dev-Server:
   ```bash
   npm run dev
   ```

3. Öffnen Sie: http://localhost:3000

4. Öffnen Sie **Browser DevTools → Console**
   - Sie sollten sehen: `"📊 Analytics Event: ..."` (nur in development)

### Live-Testing mit GTM Preview Mode

1. In GTM: Klicken Sie auf **"Vorschau"**
2. Geben Sie Ihre Website-URL ein: `https://immovestr.de`
3. GTM öffnet ein Preview-Fenster
4. Navigieren Sie durch Ihre Seite
5. Im Preview-Fenster sehen Sie alle gefeuerten Events in Echtzeit

### GA4 Echtzeit-Berichte

1. In GA4: **Berichte → Echtzeit**
2. Öffnen Sie Ihre Website in einem neuen Tab
3. Sie sollten Ihren Besuch in Echtzeit sehen (kann 1-2 Minuten dauern)

---

## 🎯 Teil 5: Getrackte Events (AI-Agent Ready)

Folgende Events werden automatisch getrackt:

### User Journey Events

| Event Name | Wann gefeuert | Parameter |
|------------|---------------|-----------|
| `page_view` | Bei jedem Seitenaufruf | `page_location`, `page_title` |
| `cta_clicked` | CTA-Button geklickt | `cta_name`, `cta_location` |
| `faq_opened` | FAQ ausgeklappt | `cta_location: 'faq_section'` |

### AI Import Events

| Event Name | Wann gefeuert | Parameter |
|------------|---------------|-----------|
| `ai_import_started` | Import gestartet | `import_method: 'screenshot' \| 'url'`<br>`import_url?: string` (nur bei URL-Import) |
| `ai_import_completed` | Import erfolgreich | `import_method`<br>`import_url?: string` (nur bei URL-Import)<br>`has_warnings: boolean` |
| `ai_import_failed` | Import fehlgeschlagen | `import_method`<br>`import_url?: string` (nur bei URL-Import)<br>`error: string` |

### Conversion Events

| Event Name | Wann gefeuert | Parameter |
|------------|---------------|-----------|
| `input_method_selected` | Eingabemethode gewählt | `input_method: 'ai_import' \| 'manual' \| 'excel'` |
| `pricing_page_viewed` | Pricing-Seite besucht | - |
| `upgrade_clicked` | Upgrade-Button geklickt | `plan_name`, `click_location` |
| `purchase` | Kauf abgeschlossen | `transaction_id`, `value`, `currency`, `items` |

### Beispiel-Verwendung in Komponenten

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackCTA, trackUpgradeClick } = useAnalytics();

  return (
    <button
      onClick={() => trackCTA('start_analysis', 'hero')}
    >
      Jetzt starten
    </button>
  );
}
```

---

## 🤖 Teil 6: AI-Agent Integration

### Google Analytics Data API einrichten

1. Gehen Sie zu: https://console.cloud.google.com
2. Erstellen Sie ein neues Projekt: **ImVestr Analytics**
3. Aktivieren Sie die **Google Analytics Data API**
4. Erstellen Sie einen **Service Account**:
   - Name: `imvestr-ai-agent`
   - Rolle: **Viewer**
5. Erstellen Sie einen **JSON Key** und laden Sie ihn herunter
6. In GA4: **Verwaltung → Property-Zugriffsmanagement**
   - Fügen Sie die Service Account Email hinzu (z.B. `imvestr-ai-agent@...gserviceaccount.com`)
   - Rolle: **Betrachter**

### AI-Agent Beispiel-Code (Python)

```python
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest

# Authentifizierung
client = BetaAnalyticsDataClient.from_service_account_json('key.json')

# Anfrage: Alle AI Import Events der letzten 30 Tage
request = RunReportRequest(
    property=f"properties/YOUR_PROPERTY_ID",
    date_ranges=[{"start_date": "30daysAgo", "end_date": "today"}],
    dimensions=[{"name": "eventName"}, {"name": "customEvent:import_method"}],
    metrics=[{"name": "eventCount"}],
    dimension_filter={
        "filter": {
            "field_name": "eventName",
            "string_filter": {
                "match_type": "BEGINS_WITH",
                "value": "ai_import"
            }
        }
    }
)

response = client.run_report(request)

# AI kann jetzt analysieren:
# - Erfolgsrate der AI-Imports (completed vs failed)
# - Bevorzugte Import-Methode (screenshot vs url)
# - Fehler-Patterns erkennen
```

### Nützliche AI-Agent Queries

1. **Conversion Rate berechnen**:
   ```
   (purchase_completed / cta_clicked) * 100
   ```

2. **AI Import Success Rate**:
   ```
   (ai_import_completed / ai_import_started) * 100
   ```

3. **Drop-off Points identifizieren**:
   - Wo verlassen User den Funnel?
   - Welche Features werden nicht genutzt?

4. **Cohort Analysis**:
   - Retention Rate nach 7/30/90 Tagen
   - Feature-Nutzung nach User-Typ

---

## 📈 Teil 7: Wichtige Metriken für SaaS

### Key Performance Indicators (KPIs)

| Metrik | GA4 Name | Bedeutung |
|--------|----------|-----------|
| **CAC** (Customer Acquisition Cost) | Custom berechnen | Marketingkosten / Neue Kunden |
| **MRR** (Monthly Recurring Revenue) | Via Stripe + GA4 | Monatlicher wiederkehrender Umsatz |
| **Churn Rate** | Custom Event `subscription_cancelled` | Kündigungsrate |
| **Activation Rate** | `ai_import_completed` / Signups | % User die ersten Import abschließen |
| **Feature Adoption** | `scenario_created`, `pdf_download_clicked` | Welche Features werden genutzt? |

### Empfohlene GA4 Custom Reports

1. **Acquisition Report**: Woher kommen Ihre User?
2. **Engagement Report**: Welche Features werden am meisten genutzt?
3. **Retention Report**: Wie viele User kommen zurück?
4. **Revenue Report**: Umsatz nach Plan-Typ

---

## 🚨 Troubleshooting

### GTM lädt nicht

- ✅ `NEXT_PUBLIC_GTM_ID` korrekt in Vercel eingetragen?
- ✅ Vercel neu deployed nach ENV-Änderung?
- ✅ Browser-Cache geleert?
- ✅ Ad-Blocker deaktiviert?

### Events werden nicht getrackt

- ✅ GTM Preview Mode zeigt Events?
- ✅ Browser Console zeigt "📊 Analytics Event" (development)?
- ✅ GA4 Echtzeit-Bericht zeigt Activity?
- ✅ Events im GTM Container richtig konfiguriert?

### URLs bei AI_IMPORT_FAILED werden nicht angezeigt

**Symptom**: Sie sehen `ai_import_failed` Events, aber nicht welche URLs fehlgeschlagen sind.

**Lösung**: Custom Dimensions fehlen!

1. ✅ Folgen Sie **Teil 3: Custom Dimensions für Event-Parameter einrichten**
2. ✅ Erstellen Sie mindestens die Dimension `import_url`
3. ✅ Warten Sie 24h (Custom Dimensions gelten nur für NEUE Daten)
4. ✅ Nutzen Sie **Explorations** statt Standard-Reports

**Test ob URLs getrackt werden**:

1. Öffnen Sie die Browser DevTools (F12)
2. Gehen Sie zum **Console Tab**
3. Öffnen Sie `/input-method` Seite
4. Versuchen Sie einen URL-Import mit einer ungültigen URL (z.B. `https://example.com`)
5. Sie sollten sehen:
   ```
   📊 Analytics Event: ai_import_started {import_method: 'url', import_url: 'https://example.com', ...}
   📊 Analytics Event: ai_import_failed {import_method: 'url', import_url: 'https://example.com', error: '...'}
   ```

**Wenn Sie diese Logs NICHT sehen**:
- ✅ Ist `NODE_ENV=development` gesetzt? (Logs nur in development)
- ✅ In production: Nutzen Sie GTM Preview Mode oder GA4 DebugView

**DebugView nutzen** (für production testing):

1. Installieren Sie: [Google Analytics Debugger Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Aktivieren Sie die Extension
3. Öffnen Sie Ihre Website
4. GA4 → **Configure → DebugView**
5. Führen Sie einen fehlgeschlagenen Import durch
6. In DebugView sehen Sie `ai_import_failed` mit allen Parametern (inkl. `import_url`)

### GA4 zeigt keine Daten

- ⏱️ Erste Daten können 24-48h dauern (außer Echtzeit-Bericht)
- ✅ Measurement ID korrekt im GTM Tag?
- ✅ Stream aktiv in GA4?

---

## 📚 Weiterführende Ressourcen

- **GTM Dokumentation**: https://developers.google.com/tag-manager
- **GA4 Dokumentation**: https://developers.google.com/analytics/devguides/collection/ga4
- **GA4 Data API**: https://developers.google.com/analytics/devguides/reporting/data/v1
- **Event Tracking Best Practices**: https://support.google.com/analytics/answer/9267735

---

## 🎉 Fertig!

Ihr Analytics-Setup ist jetzt AI-Agent ready! Ihr AI-Agent kann:

✅ Alle User-Events in Echtzeit analysieren
✅ Conversion-Funnels automatisch optimieren
✅ Predictive Analytics durchführen
✅ Personalisierte Empfehlungen generieren
✅ Automatische Reports erstellen

**Viel Erfolg mit datengetriebenen Entscheidungen! 🚀**
