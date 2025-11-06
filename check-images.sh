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

echo "📁 public/ Ordner:"
check_file "public/logo.png"
check_file "public/og-image.jpg"
check_file "public/hero-background.jpg"
check_file "public/favicon.ico"

echo ""
echo "📁 src/app/ Ordner:"
check_file "src/app/favicon.ico"

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
echo "💡 Tipp: Ziehen Sie Ihre Bilddateien in VS Code in den 'public/' Ordner"
echo "   Pfad: Ihr-Projekt/public/"
