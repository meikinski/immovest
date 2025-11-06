# 🖼️ Anleitung: Bilder in VS Code hinzufügen

## ⚠️ WICHTIG: Ihre Bilder sind NOCH NICHT im Projekt!

Aktueller Status:
- ❌ `logo.png` - FEHLT
- ❌ `og-image.jpg` - FEHLT
- ❌ `hero-background.jpg` - FEHLT
- ✅ `favicon.ico` - Vorhanden (in src/app/)

---

## 📋 Schritt-für-Schritt: Bilder in VS Code hinzufügen

### **Methode 1: Drag & Drop (EINFACHSTE Methode)**

#### Schritt 1: VS Code öffnen
- Öffnen Sie VS Code mit Ihrem Projekt

#### Schritt 2: Explorer öffnen
- Klicken Sie auf das **Dokumente-Icon** in der linken Sidebar
- Oder drücken Sie: `Cmd+Shift+E` (Mac) / `Ctrl+Shift+E` (Windows)

#### Schritt 3: public/ Ordner finden
```
immovest/                    ← Ihr Projekt-Ordner
├── src/
├── public/                  ← HIER müssen die Bilder rein!
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml
├── node_modules/
└── package.json
```

**So sieht es in VS Code aus:**
```
📁 IMMOVEST
  📁 src
  📁 public    ← DIESEN ORDNER ÖFFNEN!
     📄 favicon.ico
     📄 robots.txt
     📄 sitemap.xml
  📁 node_modules
  📄 package.json
```

#### Schritt 4: Bilder hinein ziehen
1. Öffnen Sie den Finder (Mac) oder Explorer (Windows)
2. Navigieren Sie zu Ihren Bildern (z.B. Downloads, Desktop)
3. Wählen Sie die Dateien aus:
   - `logo.png`
   - `og-image.jpg`
   - `hero-background.jpg`
4. **ZIEHEN** Sie sie mit der Maus **direkt** auf den `public/` Ordner in VS Code
5. Lassen Sie die Maus los

#### Schritt 5: Überprüfen
Nach dem Drag & Drop sollte es so aussehen:
```
📁 public
   📄 favicon.ico
   📄 robots.txt
   📄 sitemap.xml
   📄 logo.png              ← NEU!
   📄 og-image.jpg          ← NEU!
   📄 hero-background.jpg   ← NEU!
```

---

### **Methode 2: Über das Kontextmenü**

#### Schritt 1: Rechtsklick auf `public/` Ordner
- Im VS Code Explorer
- Rechtsklick auf den `public/` Ordner

#### Schritt 2: "Reveal in Finder/Explorer" wählen
- Mac: "Reveal in Finder"
- Windows: "Reveal in File Explorer"

#### Schritt 3: Bilder kopieren
- Der Finder/Explorer öffnet sich mit dem `public/` Ordner
- Kopieren Sie Ihre Bilder in diesen Ordner
- VS Code erkennt die Änderungen automatisch

---

### **Methode 3: Über Terminal (für Profis)**

Wenn Ihre Bilder z.B. im Downloads-Ordner liegen:

```bash
# Mac
cp ~/Downloads/logo.png public/
cp ~/Downloads/og-image.jpg public/
cp ~/Downloads/hero-background.jpg public/

# Windows (PowerShell)
Copy-Item C:\Users\IhrName\Downloads\logo.png public\
Copy-Item C:\Users\IhrName\Downloads\og-image.jpg public\
Copy-Item C:\Users\IhrName\Downloads\hero-background.jpg public\
```

---

## ✅ Nach dem Hinzufügen: Überprüfen

### Terminal-Befehl zum Überprüfen:
```bash
# Im VS Code Terminal (Ctrl+` oder Cmd+`)
bash check-images.sh
```

Oder manuell prüfen:
```bash
ls -la public/*.{png,jpg,jpeg}
```

Sie sollten sehen:
```
public/logo.png
public/og-image.jpg
public/hero-background.jpg
```

---

## 🔄 Development Server neu starten

**WICHTIG:** Nach dem Hinzufügen der Bilder:

1. **Server stoppen:**
   - Im Terminal: `Ctrl+C` drücken

2. **Server neu starten:**
   ```bash
   npm run dev
   ```

3. **Browser-Cache leeren:**
   - Mac: `Cmd+Shift+R`
   - Windows: `Ctrl+Shift+F5`
   - Oder: Inkognito-Fenster öffnen

---

## 🎯 Was passiert dann?

### Wenn `logo.png` hinzugefügt wurde:
- ✅ Logo erscheint in der Navigation (oben links)
- ✅ Logo erscheint im Hero-Bereich (große weiße Box)

### Wenn `og-image.jpg` hinzugefügt wurde:
- ✅ Schöne Vorschau beim Teilen auf Social Media

### Wenn `hero-background.jpg` hinzugefügt wurde:
- ✅ Hintergrundbild im Hero-Bereich sichtbar (subtil, 20% Opazität)

### Wenn `favicon.ico` vorhanden ist:
- ✅ Icon im Browser-Tab wird angezeigt
- (Benötigt manchmal mehrere Hard Refreshes)

---

## 🆘 Probleme?

### "Ich sehe broken image icons"
→ Die Bilddateien sind NICHT im `public/` Ordner
→ Überprüfen Sie mit: `bash check-images.sh`

### "Favicon wird nicht angezeigt"
→ Machen Sie einen **Hard Refresh**: `Cmd+Shift+R` / `Ctrl+Shift+F5`
→ Oder öffnen Sie ein Inkognito-Fenster
→ Browser-Cache ist sehr hartnäckig bei Favicons!

### "Hero Background wird nicht angezeigt"
→ Überprüfen Sie, ob `public/hero-background.jpg` existiert
→ Server neu starten: `npm run dev`
→ Hard Refresh im Browser

### "Ich kann den public/ Ordner nicht finden"
→ Drücken Sie `Cmd+P` (Mac) / `Ctrl+P` (Windows)
→ Tippen Sie: `public/`
→ Wählen Sie einen der angezeigten Dateien
→ Jetzt sehen Sie den public/ Ordner im Explorer

---

## 📊 Prioritäten:

### KRITISCH (Seite funktioniert nicht ohne):
1. **logo.png** - 512x512px oder größer, transparent PNG
2. **og-image.jpg** - Genau 1200x630px

### OPTIONAL (macht es schöner):
3. **hero-background.jpg** - 1920x1080px oder größer

---

## 💡 Tipps:

- Dateinamen **genau** so schreiben: `logo.png` (Kleinbuchstaben!)
- **Nicht** umbenennen in `Logo.png` oder `LOGO.PNG`
- Format beachten: `.png` für Logo, `.jpg` für Bilder
- Nach dem Hinzufügen: **Server neu starten!**

---

**Haben Sie die Bilder hinzugefügt? Führen Sie aus:**
```bash
bash check-images.sh
```

Das zeigt Ihnen sofort, ob alle Dateien korrekt liegen! ✅
