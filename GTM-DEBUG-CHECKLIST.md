# 🔧 GTM Debug Checklist - Import URL fehlt

## Problem
Events werden getrackt, aber `import_url` Parameter fehlt in GA4.

## Debug-Schritte

### 1. Check: Werden Events mit URL im Code gesendet?

**In deiner App öffnen:** https://imvestr.de/input-method

1. Browser DevTools öffnen (F12)
2. Console Tab
3. Ungültige URL eingeben: `https://example.com`
4. "Mit KI analysieren" klicken
5. **Erwartung**: Du solltest sehen:
   ```
   📊 Analytics Event: ai_import_failed {
     import_method: 'url', 
     import_url: 'https://example.com',
     error: '...'
   }
   ```

**✅ Wenn du das siehst**: Code ist OK, Problem liegt in GTM
**❌ Wenn du das NICHT siehst**: Problem liegt im Code

---

### 2. Check: Kommt der Event in GTM an?

**GTM Preview Mode nutzen:**

1. Gehe zu: https://tagmanager.google.com
2. Klicke **"Vorschau"** (oben rechts)
3. Gib deine URL ein: `https://imvestr.de`
4. Im Preview-Fenster: Gehe zu `/input-method`
5. Sende einen Test-Import
6. Im GTM Preview schau unter **"Messages"**
7. Klicke auf `ai_import_failed` Event
8. Schau unter **"Data Layer"** Tab
9. **Erwartung**: Du solltest sehen:
   ```
   {
     event: "ai_import_failed",
     import_url: "https://example.com",
     import_method: "url",
     error: "..."
   }
   ```

**✅ Wenn du das siehst**: dataLayer ist OK, Problem liegt im GA4 Tag
**❌ Wenn du das NICHT siehst**: dataLayer wird nicht richtig gefüllt

---

### 3. Check: GTM Tag Konfiguration

**In GTM:**

1. **Tags** → Finde dein **GA4 Configuration** Tag
2. Klicke drauf zum Editieren
3. Prüfe folgende Settings:

#### Measurement ID
```
✅ MUSS: G-XXXXXXXXXX (deine echte GA4 ID)
```

#### Configuration Settings
```
❌ FALSCH: "Fields to Set" mit benutzerdefinierten Parametern
✅ RICHTIG: Keine benutzerdefinierten Fields!
```

**WICHTIG**: GTM sendet automatisch ALLE dataLayer Properties an GA4.
Du musst NICHTS manuell konfigurieren!

#### Trigger
```
✅ MUSS: All Pages (oder spezifischer Trigger der auf allen Seiten feuert)
```

---

### 4. Check: GA4 Event Tag (Falls vorhanden)

Hast du ein **separates** GA4 Event Tag für `ai_import_failed`?

**Falls JA:**
1. **Tags** → GA4 Event Tag
2. **Event Name**: `ai_import_failed`
3. **Event Parameters**: Prüfe ob `import_url` als Parameter definiert ist
   ```
   Parameter Name: import_url
   Value: {{DLV - import_url}}  // Datalay Variable
   ```

**Falls NEIN:**
- Gut! Du brauchst kein separates Event Tag.
- Der GA4 Configuration Tag sollte alle Events automatisch senden.

---

### 5. Check: GA4 Measurement Protocol Secrets (Falls API genutzt wird)

Sendet dein Backend direkt an GA4 Measurement Protocol?

**Falls JA:**
1. Check ob der API Request den Parameter enthält:
   ```json
   {
     "events": [{
       "name": "ai_import_failed",
       "params": {
         "import_url": "https://...",
         "import_method": "url",
         "error": "..."
       }
     }]
   }
   ```

**Falls NEIN:**
- Weiter zu Schritt 6

---

### 6. Check: Custom Dimension Parameter Name

In GA4:
1. **Configure** → **Custom Definitions** → **Custom Dimensions**
2. Klicke auf **"Import URL"**
3. Prüfe **"Ereignisparameter"**
   ```
   ✅ MUSS EXAKT SEIN: import_url
   ❌ FALSCH: Import URL, import-url, importUrl
   ```

**Case-sensitive!** Muss exakt `import_url` sein wie im Code.

---

### 7. Finale Lösung: GA4 Event Tag erstellen

Wenn nichts anderes funktioniert, erstelle ein **neues GA4 Event Tag**:

1. **GTM → Tags → Neu**
2. **Tag Type**: Google Analytics: GA4 Event
3. **Configuration Tag**: [Deine GA4 Configuration Tag]
4. **Event Name**: `{{Event}}` (Variable)
5. **Event Parameters** hinzufügen:
   ```
   Parameter Name: import_url
   Value: {{import_url}}  // oder {{DLV - import_url}}
   
   Parameter Name: import_method  
   Value: {{import_method}}
   
   Parameter Name: error
   Value: {{error}}
   ```
6. **Trigger**: Custom Event = `ai_import_failed`
7. **Speichern** und **Container veröffentlichen**

**Wichtig**: Du brauchst dann auch **Datalay Variables** in GTM:
- Variable Name: `import_url`
- Variable Type: Data Layer Variable
- Data Layer Variable Name: `import_url`

(Gleich für `import_method`, `error`, etc.)

---

## Quick Win: DebugView nutzen

**Statt GTM Preview:**

1. Installiere: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Aktiviere Extension
3. GA4 → **Configure → DebugView**
4. Öffne deine App: https://imvestr.de/input-method
5. Sende Test-Event
6. In DebugView siehst du SOFORT ob `import_url` ankommt

**Vorteil**: Zeigt genau was GA4 empfängt, ohne GTM Preview!

---

## Häufigster Fehler

**Problem**: GTM Configuration Tag sendet Events, aber ohne Parameter.

**Ursache**: Tag feuert VOR dem dataLayer.push()

**Lösung**: 
1. Nutze **Custom Event Trigger**: `ai_import_failed`
2. NICHT "All Pages" Trigger für Event-spezifische Daten

---

## Erfolg!

Wenn `import_url` in DebugView ankommt:
✅ Tracking funktioniert
✅ Custom Dimension zeigt URLs für NEUE Events
✅ Problem gelöst!

