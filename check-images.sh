#!/bin/bash
# Hilfsskript zum Überprüfen, ob alle benötigten Bilder vorhanden sind

echo "🔍 Überprüfe Bilddateien..."
echo ""

check_file() {
    if [ -f "$1" ]; then
        size=$(ls -lh "$1" | awk '{print $5}')
        echo "✅ $1 - Vorhanden ($size)"
        return 0
    else
        echo "❌ $1 - FEHLT"
        return 1
    fi
}

echo "📁 public/ Ordner - Benötigte Bilder:"
check_file "public/logo.png"
check_file "public/og-image.jpg"
check_file "public/hero-background.jpg"
check_file "public/favicon.ico"

echo ""
echo "📁 public/ Ordner - Tatsächlich vorhandene Dateien:"
echo ""
ls -lh public/*.{png,jpg,jpeg,webp,ico} 2>/dev/null || echo "   Keine Bilddateien gefunden!"

echo ""
echo "---"
echo ""

# Zähle fehlende Dateien
missing=0
[ ! -f "public/logo.png" ] && ((missing++))
[ ! -f "public/og-image.jpg" ] && ((missing++))

if [ $missing -eq 0 ]; then
    echo "🎉 Alle kritischen Bilder sind vorhanden!"
elif [ $missing -eq 1 ]; then
    echo "⚠️  1 kritisches Bild fehlt noch"
else
    echo "⚠️  $missing kritische Bilder fehlen noch"
fi

echo ""
echo "💡 So fügen Sie Bilder hinzu:"
echo "   1. Öffnen Sie VS Code Explorer (Cmd+Shift+E / Ctrl+Shift+E)"
echo "   2. Finden Sie den 'public/' Ordner"
echo "   3. Ziehen Sie Ihre Bilddateien in diesen Ordner (Drag & Drop)"
echo "   4. Server neu starten: npm run dev"
echo ""
echo "📖 Detaillierte Anleitung: Siehe WIE-BILDER-HINZUFUEGEN.md"

