#!/bin/bash

# Test Redirects - What redirects does Google see?
# This script follows redirects and shows the full chain

echo "🔍 Testing Redirect Chains for Google Indexing"
echo "================================================"
echo ""
echo "Testing as Googlebot for Smartphones (like GSC reported)"
echo ""

USER_AGENT="Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

URLs=(
  "https://imvestr.de"
  "https://imvestr.de/"
  "https://www.imvestr.de"
  "https://www.imvestr.de/"
  "https://imvestr.de/pricing"
  "https://imvestr.de/pricing/"
  "https://imvestr.de/input-method"
  "https://imvestr.de/input-method/"
)

for url in "${URLs[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📍 Testing: $url"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Follow redirects with curl -L and show each step
  curl -L -I -A "$USER_AGENT" "$url" 2>&1 | head -30

  echo ""
  echo "Summary for $url:"

  # Get final status code
  final_status=$(curl -L -s -o /dev/null -w "%{http_code}" -A "$USER_AGENT" "$url" 2>&1)

  if [ "$final_status" = "200" ]; then
    echo "✅ Final Status: 200 OK"
  else
    echo "❌ Final Status: $final_status (NOT 200!)"
  fi

  # Count redirects
  redirect_count=$(curl -L -I -A "$USER_AGENT" "$url" 2>&1 | grep -c "HTTP/" || echo "0")
  if [ "$redirect_count" -gt 1 ]; then
    echo "⚠️  Redirect chain detected: $redirect_count hops"
  else
    echo "✅ No redirects (direct access)"
  fi

  echo ""
done

echo ""
echo "================================================"
echo "📊 INTERPRETATION:"
echo "================================================"
echo ""
echo "✅ Good: URL returns 200 with no redirects"
echo "⚠️  Warning: URL has 1 redirect (301/302) - Google can handle this"
echo "❌ Bad: URL has multiple redirects or redirect loop"
echo "❌ Bad: Final status is not 200"
echo ""
echo "Google Search Console 'Umleitungsfehler' means:"
echo "- Too many redirects (>5)"
echo "- Redirect loop (A→B→A)"
echo "- Redirect to blocked/error page"
echo ""
echo "💡 If you see multiple redirects to the same URL:"
echo "   → Check Vercel domain settings (www vs non-www)"
echo "   → Check for HTTPS redirect loops"
echo "   → Check middleware for unintended redirects"
