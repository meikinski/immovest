# 📸 Benötigte Bilddateien für ImmoVest

Dieser Ordner (`public/`) sollte folgende Bilddateien enthalten:

## ✅ Bereits vorhanden:
- `favicon.ico` - Browser Tab Icon

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

1. **Commit die Dateien zu Git:**
   ```bash
   git add public/logo.png public/og-image.jpg public/apple-touch-icon.png
   git commit -m "Add logo and social media images"
   git push
   ```

2. **Teste die Social Media Vorschau:**
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator

3. **Cache leeren:**
   - Browser-Cache leeren (Cmd+Shift+R / Ctrl+Shift+R)
   - Bei Problemen: Inkognito-Fenster testen

---

## 🎨 Design-Tipps:

- Nutze die Brand-Farben: `#264171` (Navy Blue) und `#E6AE63` (Gold/Orange)
- Logo sollte auch bei kleiner Größe gut erkennbar sein
- Für og-image: Wichtige Elemente in der Mitte platzieren (Mobile Crop!)
- Verwende hohe Auflösung für bessere Qualität

---

**Hinweis**: Diese Datei kann gelöscht werden, sobald alle Bilder hinzugefügt wurden.
