# 📸 Benötigte Bilddateien für ImVestr

Dieser Ordner (`public/`) sollte folgende Bilddateien enthalten:

## ✅ Bereits vorhanden:
- `favicon.ico` - Browser Tab Icon (wird als Fallback verwendet)
- `robots.txt` - SEO Konfiguration
- `sitemap.xml` - Sitemap für Suchmaschinen

**Hinweis**: Das Favicon wird jetzt dynamisch aus `src/app/icon.tsx` generiert.
Sie sehen ein "IV" Logo (ImVestr Initialen) bis Sie ein echtes Logo hinzufügen.

## ⚠️ FEHLT NOCH - Bitte hinzufügen:

### 1. **logo.png** (PRIORITÄT: HOCH)
- **Verwendung**: Navigation, Schema.org Organization Logo
- **Format**: PNG mit transparentem Hintergrund
- **Größe**: 512x512 px oder 1024x1024 px (quadratisch!)
- **Pfad**: `public/logo.png`
- **Wird verwendet in**: Alle Seiten-Header, Google Knowledge Panel

### 2. **og-image.jpg** (PRIORITÄT: HOCH)
- **Verwendung**: Social Media Preview (Facebook, Twitter, LinkedIn)
- **Format**: JPG oder PNG
- **Größe**: **1200 x 630 px** (genau!)
- **Pfad**: `public/og-image.jpg`
- **Inhalt**: Logo + Text "KI-basierter Immobilien-Renditerechner"
- **Beispiel-Layout**:
  ```
  ┌─────────────────────────────────┐
  │         [Logo]                  │
  │                                 │
  │  KI-basierter                   │
  │  Immobilien-Renditerechner      │
  │                                 │
  │  immovestr.de                   │
  └─────────────────────────────────┘
  ```

### 3. **apple-touch-icon.png** (PRIORITÄT: MITTEL)
- **Verwendung**: iOS Home Screen Icon
- **Format**: PNG
- **Größe**: 180 x 180 px
- **Pfad**: `public/apple-touch-icon.png`

### 4. **icon-192.png** (PRIORITÄT: NIEDRIG)
- **Verwendung**: PWA Icon (klein)
- **Format**: PNG
- **Größe**: 192 x 192 px
- **Pfad**: `public/icon-192.png`

### 5. **icon-512.png** (PRIORITÄT: NIEDRIG)
- **Verwendung**: PWA Icon (groß)
- **Format**: PNG
- **Größe**: 512 x 512 px
- **Pfad**: `public/icon-512.png`

### 6. **hero-background.jpg** (OPTIONAL, aber empfohlen)
- **Verwendung**: Hintergrundbild für Hero-Bereich auf der Startseite
- **Format**: JPG (für kleinere Dateigröße)
- **Größe**: Mindestens **1920 x 1080 px** (Full HD)
- **Besser**: 2560 x 1440 px (für hochauflösende Displays)
- **Pfad**: `public/hero-background.jpg`
- **Inhalt-Vorschläge**:
  - Stadtpanorama / Skyline (moderne Gebäude)
  - Immobilien/Wohngebäude
  - Abstrakte geometrische Muster
  - Dunkles Bild funktioniert am besten (wird mit 20% Opazität überlagert)
- **Tipp**: Bild wird mit dunklem Gradient überlagert, also helle Bilder funktionieren gut

**Wenn Sie KEIN Hintergrundbild haben:**
- Die Seite funktioniert trotzdem perfekt
- Es wird nur der Gradient-Hintergrund angezeigt
- Das Bild ist rein dekorativ

---

## 📋 Wie füge ich die Dateien hinzu?

### Methode 1: Drag & Drop in VS Code
1. Öffne VS Code
2. Finde den `public/` Ordner im Explorer (linke Sidebar)
3. Ziehe deine Bilddateien direkt in diesen Ordner
4. Fertig!

### Methode 2: Über Finder/Windows Explorer
1. Öffne deinen Projekt-Ordner im Finder/Explorer
2. Navigiere zum `public/` Unterordner
3. Kopiere deine Bilder in diesen Ordner
4. VS Code erkennt die Änderungen automatisch

---

## ✅ Nach dem Hinzufügen:

1. **Development Server neu starten:**
   ```bash
   # Terminal: Ctrl+C zum Stoppen
   npm run dev
   ```

2. **Commit die Dateien zu Git:**
   ```bash
   git add public/logo.png public/og-image.jpg public/hero-background.jpg
   git commit -m "Add logo, social media image and hero background"
   git push
   ```

3. **Teste die Social Media Vorschau:**
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator

4. **Cache leeren:**
   - Browser-Cache leeren (Cmd+Shift+R / Ctrl+Shift+R)
   - Bei Problemen: Inkognito-Fenster testen

---

## 📊 Prioritäten-Übersicht:

### SOFORT (kritisch für Funktionalität):
1. ✅ **logo.png** - Wird in Navigation UND Hero angezeigt
2. ✅ **og-image.jpg** - Wichtig für Social Media Shares

### BALD (empfohlen):
3. 🔶 **hero-background.jpg** - Macht die Startseite visuell ansprechender
4. 🔶 **apple-touch-icon.png** - Wichtig für iOS User

### SPÄTER (optional):
5. ⚪ **icon-192.png** & **icon-512.png** - Nur für PWA nötig

---

## 🎯 Schnellstart-Checkliste:

Für einen vollständig funktionalen Start brauchen Sie NUR:

- [ ] `logo.png` (512x512 oder größer, transparent PNG)
- [ ] `og-image.jpg` (1200x630, mit Logo + Text)

Das war's! Alles andere ist optional.

---

## 🎨 Design-Tipps:

- Nutze die Brand-Farben: `#264171` (Navy Blue) und `#E6AE63` (Gold/Orange)
- Logo sollte auch bei kleiner Größe gut erkennbar sein
- Für og-image: Wichtige Elemente in der Mitte platzieren (Mobile Crop!)
- Verwende hohe Auflösung für bessere Qualität

---

**Hinweis**: Diese Datei kann gelöscht werden, sobald alle Bilder hinzugefügt wurden.
