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

## ✅ Teil 3: Testen der Installation

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

## 🎯 Teil 4: Getrackte Events (AI-Agent Ready)

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

## 🤖 Teil 5: AI-Agent Integration

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

## 🔗 Teil 6: Custom Dimensions für URL-Tracking einrichten

### Warum Custom Dimensions?

Die Event-Parameter `import_url`, `import_method`, `error` etc. werden standardmäßig NICHT in GA4 Reports angezeigt. Sie müssen als **Custom Dimensions** registriert werden.

### Schritt 1: Custom Dimensions in GA4 erstellen

1. **Öffnen Sie GA4**: https://analytics.google.com
2. Navigieren Sie zu: **Verwaltung → Benutzerdefinierte Definitionen → Benutzerdefinierte Dimensionen erstellen**
3. Klicken Sie auf **"Benutzerdefinierte Dimension erstellen"**

**Dimension 1: Import URL**
```
Dimensionsname: Import URL
Umfang: Ereignis
Beschreibung: URL die beim AI-Import verwendet wurde
Ereignisparameter: import_url
```

**Dimension 2: Import Method**
```
Dimensionsname: Import Method
Umfang: Ereignis
Beschreibung: Methode des AI-Imports (screenshot oder url)
Ereignisparameter: import_method
```

**Dimension 3: Import Error**
```
Dimensionsname: Import Error
Umfang: Ereignis
Beschreibung: Fehlermeldung bei fehlgeschlagenem Import
Ereignisparameter: error
```

**Dimension 4: Has Warnings**
```
Dimensionsname: Has Warnings
Umfang: Ereignis
Beschreibung: Ob Import Warnungen hatte
Ereignisparameter: has_warnings
```

4. **Wichtig**: Nach dem Erstellen kann es **24-48 Stunden** dauern, bis Daten gesammelt werden

### Schritt 2: Custom Report für URL-Analyse erstellen

**Option A: Exploration (Empfohlen)**

1. In GA4: **Erkunden → Leere Exploration erstellen**
2. **Technik auswählen**: Freiform-Tabelle
3. **Dimensionen hinzufügen**:
   - `Ereignisname`
   - `Import URL` (Ihre Custom Dimension)
   - `Import Method`
   - `Import Error`
4. **Messwerte hinzufügen**:
   - `Ereignisanzahl`
   - `Ereignisanzahl pro Nutzer`
5. **Filter hinzufügen**:
   - `Ereignisname` → `enthält` → `ai_import`
6. **Exploration benennen**: "AI Import URL-Analyse"

**Option B: Benutzerdefinierte Berichte**

1. **Bibliothek → Berichte-Sammlung bearbeiten**
2. **Neuer Bericht hinzufügen**
3. Konfigurieren mit denselben Dimensionen wie oben

### Schritt 3: Nützliche Analysen durchführen

**Analyse 1: Welche Portale werden am häufigsten genutzt?**

```
Dimensions: Import URL
Metrics: Event Count
Filter: Event name = ai_import_started
Sort: Event Count DESC
```

**Analyse 2: Erfolgsrate nach Domain**

1. Erstellen Sie eine Segment-Überschneidung:
   - Segment A: `ai_import_started` mit `import_url` enthält `immobilienscout24.de`
   - Segment B: `ai_import_completed` mit `import_url` enthält `immobilienscout24.de`
2. Berechnen Sie: `Completed / Started * 100`

**Analyse 3: Problematische URLs identifizieren**

```
Dimensions: Import URL, Import Error
Metrics: Event Count
Filter: Event name = ai_import_failed
Sort: Event Count DESC
```

### Schritt 4: Data Studio Dashboard erstellen (Optional)

1. Gehen Sie zu: https://lookerstudio.google.com
2. **Erstellen → Bericht**
3. **Datenquelle hinzufügen**: Ihre GA4 Property
4. **Widgets hinzufügen**:
   - **Tabelle**: Top 10 URLs nach Import-Anzahl
   - **Balkendiagramm**: Erfolgsrate nach Portal
   - **Zeitreihendiagramm**: URL-Imports über Zeit
   - **Scorecards**: Gesamt-Imports, Erfolgsrate, Fehlerrate

### Beispiel: Python Analytics Query mit import_url

```python
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest

client = BetaAnalyticsDataClient.from_service_account_json('key.json')

# Top 10 meistgenutzte Import-URLs
request = RunReportRequest(
    property=f"properties/YOUR_PROPERTY_ID",
    date_ranges=[{"start_date": "30daysAgo", "end_date": "today"}],
    dimensions=[
        {"name": "eventName"},
        {"name": "customEvent:import_url"},
        {"name": "customEvent:import_method"}
    ],
    metrics=[{"name": "eventCount"}],
    dimension_filter={
        "filter": {
            "field_name": "eventName",
            "string_filter": {"value": "ai_import_started"}
        }
    },
    order_bys=[{"metric": {"metric_name": "eventCount"}, "desc": True}],
    limit=10
)

response = client.run_report(request)

# Ausgabe
for row in response.rows:
    url = row.dimension_values[1].value
    count = row.metric_values[0].value
    print(f"{url}: {count} Imports")

# Beispiel Output:
# https://www.immobilienscout24.de/expose/12345: 47 Imports
# https://www.immowelt.de/expose/67890: 23 Imports
# https://www.ebay-kleinanzeigen.de/s-anzeige/98765: 15 Imports
```

### Wichtige Metriken für URL-Tracking

| Metrik | Berechnung | Bedeutung |
|--------|------------|-----------|
| **Top Import-Portale** | `GROUP BY domain(import_url)` | Welche Portale nutzen User? |
| **Portal-Erfolgsrate** | `(completed / started) * 100 per domain` | Welche Portale funktionieren am besten? |
| **Fehlerhafte URLs** | `COUNT import_url WHERE event = ai_import_failed` | Problematische URLs finden |
| **Durchschnitt Imports/User** | `COUNT DISTINCT import_url / COUNT DISTINCT user_id` | User-Engagement |

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

## 🚨 Teil 8: Troubleshooting

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
