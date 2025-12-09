# Google Analytics 4 & Google Tag Manager Setup für Purchase-Event

Diese Anleitung hilft dir, Google Analytics 4 und Google Tag Manager zu konfigurieren, um das bereits implementierte Purchase-Event zu tracken.

## 📋 Voraussetzungen

- Google Account
- Zugriff auf deine Website-Domain
- Das Purchase-Event ist bereits im Code implementiert ✅

---

## 🚀 Schritt 1: Google Analytics 4 (GA4) einrichten

### 1.1 GA4-Property erstellen

1. Gehe zu [Google Analytics](https://analytics.google.com)
2. Klicke auf **"Verwaltung"** (Zahnrad-Symbol unten links)
3. Klicke auf **"+ Property erstellen"**
4. Gib einen Property-Namen ein (z.B. "ImVestr")
5. Wähle Zeitzone: **Deutschland** und Währung: **Euro (EUR)**
6. Klicke auf **"Weiter"**
7. Wähle Branchenkategorie: **Immobilien**
8. Unternehmensgröße: entsprechend deiner Größe
9. Verwendungszweck: **"Lead-Generierung"** und **"Online-Verkäufe messen"**
10. Klicke auf **"Erstellen"**
11. Akzeptiere die Nutzungsbedingungen

### 1.2 Datenstream einrichten

1. Wähle Plattform: **"Web"**
2. Website-URL: `https://immovestr.de` (oder deine Domain)
3. Stream-Name: "ImVestr Website"
4. Klicke auf **"Stream erstellen"**
5. **Notiere dir die Mess-ID** (Format: `G-XXXXXXXXXX`)

### 1.3 E-Commerce aktivieren

1. Gehe in den gerade erstellten Datenstream
2. Scrolle zu **"Erweiterte Einstellungen"**
3. Aktiviere **"E-Commerce-Messung"** ✅
4. Speichern

---

## 🏷️ Schritt 2: Google Tag Manager (GTM) einrichten

### 2.1 GTM-Container erstellen

1. Gehe zu [Google Tag Manager](https://tagmanager.google.com)
2. Klicke auf **"Konto erstellen"**
3. **Kontoname**: "ImVestr"
4. **Land**: Deutschland
5. Klicke auf **"Weiter"**
6. **Container-Name**: "immovestr.de"
7. **Zielplattform**: **Web**
8. Klicke auf **"Erstellen"**
9. Akzeptiere die Nutzungsbedingungen
10. **Notiere dir die GTM-ID** (Format: `GTM-XXXXXXX`)

### 2.2 GA4-Tag in GTM erstellen

1. In deinem GTM-Container, klicke auf **"Tag hinzufügen"**
2. Tag-Name: **"GA4 - Configuration"**
3. Klicke auf **"Tag-Konfiguration"**
4. Wähle **"Google Analytics: GA4-Konfiguration"**
5. Mess-ID: Trage deine GA4 Mess-ID ein (`G-XXXXXXXXXX`)
6. **Trigger**: Wähle **"All Pages"**
7. Klicke auf **"Speichern"**

### 2.3 Purchase-Event Tag erstellen

1. Klicke auf **"Tag hinzufügen"**
2. Tag-Name: **"GA4 - Purchase Event"**
3. Tag-Konfiguration: **"Google Analytics: GA4-Ereignis"**
4. **Konfigurations-Tag**: Wähle "GA4 - Configuration"
5. **Ereignisname**: `purchase`
6. **Ereignisparameter** hinzufügen:

| Parametername | Wert |
|--------------|------|
| `transaction_id` | `{{dlv - transaction_id}}` |
| `value` | `{{dlv - value}}` |
| `currency` | `{{dlv - currency}}` |
| `subscription_plan_id` | `{{dlv - subscription_plan_id}}` |
| `subscription_interval` | `{{dlv - subscription_interval}}` |
| `items` | `{{dlv - items}}` |

7. **Trigger**: Wir erstellen jetzt einen Custom Event Trigger

### 2.4 Custom Event Trigger für Purchase erstellen

1. Bei Triggern, klicke auf **"Neu"**
2. Trigger-Name: **"Purchase Event"**
3. Trigger-Typ: **"Benutzerdefiniertes Ereignis"**
4. Ereignisname: `purchase`
5. **Dieses Ereignis tritt auf**: "Alle benutzerdefinierten Ereignisse"
6. Klicke auf **"Speichern"**
7. Gehe zurück zum "GA4 - Purchase Event" Tag
8. Wähle den soeben erstellten Trigger: **"Purchase Event"**
9. Klicke auf **"Speichern"**

### 2.5 DataLayer-Variablen erstellen

Erstelle für jeden Parameter eine Variable:

**Variable 1: transaction_id**
1. Variablen → **"Neu"**
2. Name: `dlv - transaction_id`
3. Variablentyp: **"Datenschichtvariable"**
4. Name der Datenschichtvariablen: `transaction_id`
5. Speichern

**Variable 2: value**
1. Name: `dlv - value`
2. Variablentyp: **"Datenschichtvariable"**
3. Name der Datenschichtvariablen: `value`
4. Speichern

**Variable 3: currency**
1. Name: `dlv - currency`
2. Variablentyp: **"Datenschichtvariable"**
3. Name der Datenschichtvariablen: `currency`
4. Speichern

**Variable 4: items**
1. Name: `dlv - items`
2. Variablentyp: **"Datenschichtvariable"**
3. Name der Datenschichtvariablen: `items`
4. Speichern

**Variable 5: subscription_plan_id**
1. Name: `dlv - subscription_plan_id`
2. Variablentyp: **"Datenschichtvariable"**
3. Name der Datenschichtvariablen: `subscription_plan_id`
4. Speichern

**Variable 6: subscription_interval**
1. Name: `dlv - subscription_interval`
2. Variablentyp: **"Datenschichtvariable"**
3. Name der Datenschichtvariablen: `subscription_interval`
4. Speichern

### 2.6 GTM-Container veröffentlichen

1. Klicke oben rechts auf **"Senden"**
2. Versionsname: "Initial Setup mit Purchase Event"
3. Versionsbeschreibung: "GA4 Configuration + Purchase Event Tracking"
4. Klicke auf **"Veröffentlichen"**

---

## ⚙️ Schritt 3: Umgebungsvariablen setzen

### 3.1 .env.local erstellen

1. Kopiere die Beispiel-Datei:
```bash
cp .env.local.example .env.local
```

2. Öffne `.env.local` und trage deine IDs ein:
```bash
# Google Tag Manager & Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX          # Deine GTM-ID aus Schritt 2.1
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Deine GA4 Mess-ID aus Schritt 1.2
```

3. Speichern und Anwendung neu starten:
```bash
npm run dev
```

---

## 🧪 Schritt 4: Testing

### 4.1 GTM Preview-Modus aktivieren

1. In GTM, klicke auf **"Vorschau"** (oben rechts)
2. Gib deine Website-URL ein: `http://localhost:3000` (für lokales Testing)
3. Klicke auf **"Connect"**

### 4.2 Test-Kauf durchführen

1. Gehe auf deine lokale Website
2. Melde dich an
3. Klicke auf **"Upgrade"** → wähle ein Abo
4. Führe einen **Test-Kauf** durch (mit Stripe Test-Karten)
   - Testkarte: `4242 4242 4242 4242`
   - Ablaufdatum: beliebig in der Zukunft
   - CVC: beliebig 3 Ziffern
5. Nach erfolgreicher Zahlung wirst du zu `/profile?success=true&session_id=...` weitergeleitet

### 4.3 Event im GTM-Preview prüfen

1. Im GTM-Preview-Fenster solltest du sehen:
   - Event: `purchase`
   - Tag: "GA4 - Purchase Event" sollte **gefeuert** sein ✅
2. Klicke auf das Event und prüfe die **DataLayer-Werte**:
   ```json
   {
     "event": "purchase",
     "transaction_id": "cs_test_...",
     "value": 69,
     "currency": "EUR",
     "subscription_plan_id": "premium_yearly",
     "subscription_interval": "year",
     "items": [{
       "item_id": "premium_yearly",
       "item_name": "Imvestr Premium – Jahresabo",
       "price": 69,
       "quantity": 1
     }]
   }
   ```

### 4.4 Event in GA4 prüfen (Real-Time)

1. Gehe zu Google Analytics
2. Menü links: **"Berichte" → "Echtzeit"**
3. Du solltest das **"purchase"** Event sehen
4. Unter **"E-Commerce-Käufe"** sollte der Umsatz erscheinen

---

## 📊 Schritt 5: GA4 E-Commerce-Berichte aktivieren

1. In GA4, gehe zu **"Verwaltung"**
2. Property → **"E-Commerce-Einstellungen"**
3. Aktiviere **"E-Commerce-Berichte"** ✅
4. Speichern

Jetzt kannst du E-Commerce-Berichte unter **"Berichte" → "Monetarisierung"** sehen.

---

## 🔍 Troubleshooting

### Problem: GTM lädt nicht

**Lösung**:
- Prüfe, ob `NEXT_PUBLIC_GTM_ID` in `.env.local` gesetzt ist
- Prüfe Browser-Konsole auf Fehler
- Stelle sicher, dass du die Anwendung nach Änderung der `.env.local` neu gestartet hast

### Problem: Purchase-Event feuert nicht

**Lösung**:
- Öffne Browser DevTools → Console
- Du solltest in Development sehen: `📊 Analytics Event: purchase {...}`
- Prüfe, ob `window.dataLayer` existiert: `console.log(window.dataLayer)`
- Stelle sicher, dass der GTM-Container veröffentlicht wurde

### Problem: Event in GA4 kommt nicht an

**Lösung**:
- Prüfe im GTM-Preview, ob das Tag feuert
- Prüfe, ob die Mess-ID korrekt ist
- Es kann bis zu 24h dauern, bis Events in Standard-Berichten erscheinen
- Nutze "Echtzeit"-Berichte für sofortiges Feedback

### Problem: E-Commerce-Daten fehlen

**Lösung**:
- Stelle sicher, dass E-Commerce in GA4 aktiviert ist (Schritt 1.3)
- Prüfe, ob alle Parameter korrekt übergeben werden (transaction_id, value, currency, items)
- E-Commerce-Berichte brauchen manchmal 24-48h bis sie vollständig sind

---

## ✅ Checkliste

- [ ] GA4 Property erstellt und Mess-ID notiert
- [ ] E-Commerce in GA4 aktiviert
- [ ] GTM Container erstellt und GTM-ID notiert
- [ ] GA4-Konfigurations-Tag in GTM erstellt
- [ ] Purchase-Event Tag in GTM erstellt
- [ ] Custom Event Trigger erstellt
- [ ] DataLayer-Variablen erstellt
- [ ] GTM Container veröffentlicht
- [ ] `.env.local` mit GTM_ID und GA4_MEASUREMENT_ID erstellt
- [ ] Anwendung neu gestartet
- [ ] Test-Kauf durchgeführt
- [ ] Event im GTM-Preview verifiziert
- [ ] Event in GA4 Echtzeit-Berichten gesehen

---

## 🎉 Fertig!

Dein Purchase-Event wird jetzt vollständig zu Google Analytics 4 getrackt. Du kannst:

- **Conversions analysieren**: Wie viele Nutzer kaufen?
- **Revenue tracken**: Welcher Umsatz wird generiert?
- **Funnel-Analyse**: Wo springen Nutzer im Checkout ab?
- **A/B-Tests**: Welche Änderungen erhöhen die Conversion-Rate?

Bei Fragen oder Problemen, lass es mich wissen!
