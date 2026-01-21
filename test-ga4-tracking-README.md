# 🔍 GA4 Import URL Tracking Test Tool

## Problem

Du siehst in GA4 die Events `ai_import_failed`, aber die **Import URL** zeigt "(not set)" - obwohl die Custom Dimensions erstellt sind.

## Warum passiert das?

**Custom Dimensions in GA4 gelten nur für NEUE Daten!**

Wenn du die Custom Dimension "Import URL" **nach** den ersten Events erstellt hast, werden die alten Events **niemals** die URL zeigen. Du musst **neue Test-Events** senden.

## So verwendest du das Test-Tool

### Schritt 1: Test-Datei öffnen

```bash
# Im Browser öffnen:
open test-ga4-tracking.html
# oder
firefox test-ga4-tracking.html
```

### Schritt 2: GA4 DebugView öffnen

1. **Google Analytics Debugger Extension installieren**:
   - Chrome: https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna
   - Extension aktivieren (Icon wird blau)

2. **GA4 DebugView öffnen**:
   - Gehe zu: https://analytics.google.com
   - **Configure** → **DebugView**
   - Du solltest dein Gerät als "aktiv" sehen

### Schritt 3: Test-Events senden

Klicke auf einen der Buttons im Test-Tool:
- **AI Import Started** - Sendet `ai_import_started` mit URL
- **AI Import Completed** - Sendet `ai_import_completed` mit URL
- **AI Import Failed** - Sendet `ai_import_failed` mit URL
- **10 Random URLs** - Sendet 10 verschiedene Test-Events

### Schritt 4: In DebugView prüfen

In GA4 DebugView siehst du jetzt:

```
Event: ai_import_failed
Parameters:
  ├─ import_url: "https://www.immobilienscout24.de/expose/test-12345"
  ├─ import_method: "url"
  └─ error: "Test error: Could not extract data from URL"
```

**✅ Wenn du `import_url` siehst**: Tracking funktioniert!
**❌ Wenn `import_url` fehlt**: GTM Problem (siehe unten)

## Häufige Probleme

### Problem 1: "(not set)" in GA4 Exploration

**Ursache**: Custom Dimension wurde NACH den Events erstellt.

**Lösung**:
1. Sende NEUE Test-Events mit dem Tool
2. Warte 10-15 Minuten
3. Checke GA4 Exploration nochmal
4. Custom Dimensions zeigen nur NEUE Daten!

### Problem 2: Events kommen in DebugView, aber nicht in Explorations

**Ursache**: Normale Datenverarbeitung dauert 24-48h.

**Lösung**:
- DebugView zeigt Echtzeit-Daten
- Explorations/Reports zeigen verarbeitete Daten (24-48h Verzögerung)
- Für sofortige Checks: **Realtime Reports** nutzen

### Problem 3: import_url fehlt komplett in DebugView

**Ursache**: GTM leitet Event-Parameter nicht weiter.

**Lösung**:

1. **GTM öffnen**: https://tagmanager.google.com
2. **Tags** → Dein GA4 Configuration Tag
3. **Fields to Set** prüfen:
   - Sollte KEINE custom parameter haben (dataLayer wird automatisch weitergeleitet)
4. **Trigger**: Sollte "All Pages" sein
5. **Container veröffentlichen**!

## Production Test

Nachdem das Test-Tool funktioniert, teste die echte App:

```bash
# Development Server starten
npm run dev
```

1. Öffne: http://localhost:3000/input-method
2. Gib eine ungültige URL ein: `https://example.com`
3. Klicke "Mit KI analysieren"
4. Schau in **Browser Console** (F12):
   ```
   📊 Analytics Event: ai_import_failed {
     import_method: 'url',
     import_url: 'https://example.com',
     error: '...'
   }
   ```
5. Prüfe **GA4 DebugView**: `import_url` sollte ankommen!

## Erfolgs-Checkliste

Nach erfolgreichem Test solltest du sehen:

✅ Test-Tool sendet Events (grüne Logs)
✅ Browser Console zeigt Events mit `import_url`
✅ GA4 DebugView zeigt Events mit `import_url` Parameter
✅ GA4 Realtime Report zeigt Events (innerhalb von 1-2 Min)
✅ GA4 Exploration zeigt Import URL (nur für NEUE Events!)

## Nächste Schritte

Wenn alles funktioniert:

1. **Alte Test-Events ignorieren** - Die zeigen nie die URL
2. **Neue Events abwarten** - Custom Dimensions nur für neue Daten
3. **Production deployen** - Neue User-Events werden die URLs haben
4. **Warte 24-48h** - Für vollständige Datenverarbeitung in GA4

## Support

Wenn das Test-Tool zeigt dass Events korrekt gesendet werden, aber GA4 sie nicht empfängt:

1. Prüfe GTM Container Konfiguration
2. Prüfe ob GA4 Measurement ID korrekt ist
3. Nutze GTM Preview Mode für detailliertes Debugging
4. Checke ob Ad-Blocker GA4 blockiert

---

**Tipp**: Speichere dieses Test-Tool für zukünftige GA4 Debugging-Sessions!
