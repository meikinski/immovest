# 🔧 404 Fehler beheben

## Problem: 404 Fehler beim Server-Start

Sie sehen Fehler wie:
```
GET /placeholder-skyline.jpg 404 in 2098ms
GET /hero-background.jpg 404 in 1234ms
GET /logo.png 404 in 567ms
```

---

## ✅ Lösung in 3 Schritten:

### Schritt 1: Überprüfen Sie, ob die Bilder wirklich da sind

Führen Sie aus:
```bash
bash check-images.sh
```

**Wenn "Keine Bilddateien gefunden!" angezeigt wird:**
→ Die Bilder sind NICHT im `public/` Ordner!
→ Folgen Sie der Anleitung in `WIE-BILDER-HINZUFUEGEN.md`

---

### Schritt 2: Cache leeren (behebt placeholder-skyline.jpg Fehler)

Der `placeholder-skyline.jpg` Fehler kommt vom alten Cache:

```bash
# Terminal (Ctrl+C um Server zu stoppen)
bash clear-cache.sh

# Dann Server neu starten:
npm run dev
```

**Was macht das Skript?**
- Löscht `.next/` Ordner (Next.js Build-Cache)
- Löscht `node_modules/.cache/` (Node Cache)
- Server startet dann mit frischem Cache

---

### Schritt 3: Browser Cache leeren

Nach dem Server-Neustart:

**Mac:**
```
Cmd + Shift + R
```

**Windows:**
```
Ctrl + Shift + F5
```

**Oder:**
- Öffnen Sie ein **Inkognito-Fenster**
- Schließen Sie den Browser komplett und öffnen Sie ihn neu

---

## 🔍 Diagnose: Wo sind meine Bilder?

### Methode 1: Via Terminal prüfen
```bash
ls -la public/*.{png,jpg,jpeg}
```

**Wenn Sie sehen:**
```
ls: cannot access 'public/*.png': No such file or directory
```
→ **Keine Bilder im public/ Ordner!**

**Wenn Sie sehen:**
```
-rw-r--r-- logo.png
-rw-r--r-- og-image.jpg
-rw-r--r-- hero-background.jpg
```
→ **Bilder sind vorhanden!** ✅

---

### Methode 2: Via VS Code prüfen

1. Öffnen Sie VS Code
2. Drücken Sie `Cmd+P` (Mac) / `Ctrl+P` (Windows)
3. Tippen Sie: `public/logo.png`
4. Drücken Sie Enter

**Wenn die Datei öffnet:**
→ Bild ist vorhanden ✅

**Wenn Sie "File not found" sehen:**
→ Bild ist NICHT vorhanden ❌

---

## 🎯 Häufige Fehlerquellen

### 1. "Ich habe die Bilder hinzugefügt, aber sehe sie nicht"

**Mögliche Ursachen:**
- ❌ Bilder im falschen Ordner (z.B. in `src/` statt `public/`)
- ❌ Dateinamen falsch (z.B. `Logo.png` statt `logo.png`)
- ❌ Dateien im VS Code Workspace, aber nicht gespeichert
- ❌ Server nicht neu gestartet

**Lösung:**
```bash
# 1. Überprüfen
bash check-images.sh

# 2. Richtig in public/ verschieben (via VS Code Drag & Drop)

# 3. Server neu starten
npm run dev
```

---

### 2. "placeholder-skyline.jpg 404 Fehler"

**Ursache:** Alter Cache von vorheriger Code-Version

**Lösung:**
```bash
bash clear-cache.sh
npm run dev
```

---

### 3. "Favicon wird nicht angezeigt"

**Ursache:** Browser cached Favicons sehr aggressiv

**Lösung:**
1. Hard Refresh: `Cmd+Shift+R` / `Ctrl+Shift+F5`
2. Inkognito-Fenster öffnen
3. Browser komplett schließen und neu öffnen
4. Favicon-Cache manuell leeren:
   - Chrome: chrome://settings/clearBrowserData
   - Firefox: Preferences → Privacy → Clear Data
   - Safari: Develop → Empty Caches

---

### 4. "hero-background.jpg wird nicht angezeigt"

**Überprüfen Sie:**

```bash
# Existiert die Datei?
ls -lh public/hero-background.jpg

# Richtige Größe? (sollte > 100KB sein)
# Wenn 0 Bytes → Datei ist leer/beschädigt
```

**Hinweis:** Das Hero-Hintergrundbild ist **optional**!
- Wenn nicht vorhanden → Nur Gradient wird angezeigt
- Die Seite funktioniert trotzdem perfekt

---

## 🚀 Schnell-Fix: Alles auf einmal

Führen Sie diese Befehle nacheinander aus:

```bash
# 1. Überprüfen
bash check-images.sh

# 2. Cache leeren
bash clear-cache.sh

# 3. Server starten
npm run dev
```

Dann im Browser: **Hard Refresh** (`Cmd+Shift+R` / `Ctrl+Shift+F5`)

---

## ✅ Checkliste

- [ ] Bilder sind in `public/` (nicht in `src/` oder woanders)
- [ ] Dateinamen sind korrekt: `logo.png`, `og-image.jpg`, `hero-background.jpg`
- [ ] Cache wurde geleert: `bash clear-cache.sh`
- [ ] Server wurde neu gestartet: `npm run dev`
- [ ] Browser Cache wurde geleert: Hard Refresh
- [ ] Überprüft mit: `bash check-images.sh`

---

## 🆘 Immer noch Probleme?

Führen Sie folgendes aus und schicken Sie mir die Ausgabe:

```bash
echo "=== Datei-Check ==="
ls -la public/*.{png,jpg,jpeg,ico} 2>&1

echo ""
echo "=== Server-Log (erste 20 Zeilen) ==="
# Server starten und erste Zeilen anzeigen
npm run dev 2>&1 | head -20
```

Das hilft bei der Diagnose! 🔍
