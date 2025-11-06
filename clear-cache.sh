#!/bin/bash
# Cache-Clearing Script für Next.js

echo "🧹 Clearing Next.js Cache..."
echo ""

# Stop dev server if running
echo "1. Stelle sicher, dass der Dev Server gestoppt ist (Ctrl+C)"
echo ""

# Remove .next folder
if [ -d ".next" ]; then
    echo "2. Lösche .next Ordner..."
    rm -rf .next
    echo "   ✅ .next gelöscht"
else
    echo "2. .next Ordner existiert nicht"
fi

# Remove node_modules/.cache
if [ -d "node_modules/.cache" ]; then
    echo "3. Lösche node_modules/.cache..."
    rm -rf node_modules/.cache
    echo "   ✅ Cache gelöscht"
else
    echo "3. node_modules/.cache existiert nicht"
fi

echo ""
echo "✨ Cache erfolgreich geleert!"
echo ""
echo "Nächste Schritte:"
echo "1. Starte den Server neu: npm run dev"
echo "2. Hard Refresh im Browser: Cmd+Shift+R (Mac) / Ctrl+Shift+F5 (Windows)"
echo "3. Oder öffne ein Inkognito-Fenster"
