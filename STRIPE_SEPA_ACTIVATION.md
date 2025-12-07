# SEPA Lastschrift in Stripe Live aktivieren

## Problem
SEPA Lastschrift (`sepa_debit`) ist in der Stripe Test-Umgebung standardmäßig verfügbar, aber in der Live-Umgebung muss es explizit aktiviert werden.

## Warum SEPA aktivieren?

SEPA Lastschrift ist in Deutschland sehr beliebt:
- Viele Kunden bevorzugen Lastschrift statt Kreditkarte
- Höhere Conversion-Rate (mehr abgeschlossene Käufe)
- Besonders bei wiederkehrenden Zahlungen (Abos) beliebt

## Schritt-für-Schritt-Anleitung

### 1. Stripe Dashboard öffnen

1. Gehe zu https://dashboard.stripe.com
2. **Stelle sicher, dass du im LIVE-Modus bist** (oben rechts Toggle)

### 2. Zahlungsmethoden aktivieren

1. Navigiere zu **Einstellungen** → **Zahlungsmethoden**
   - Direktlink: https://dashboard.stripe.com/settings/payment_methods

2. Unter **Zahlungsmethoden** scrolle zu **SEPA-Lastschrift**

3. Klicke auf **Aktivieren**

### 3. Geschäftsinformationen bestätigen

Stripe kann folgende Informationen anfordern:

- **Firmenname & Adresse**
- **Geschäftstyp** (z.B. Software/SaaS)
- **Beschreibung deines Geschäfts**
- **Website-URL**
- **Steuernummer** (optional, je nach Land)

Diese Informationen werden auf dem SEPA-Lastschrift-Mandat angezeigt.

### 4. SEPA-Gläubiger-ID (optional)

Stripe bietet zwei Optionen:

**Option A: Stripe-verwaltete Gläubiger-ID (Empfohlen)**
- Stripe stellt automatisch eine Gläubiger-ID bereit
- Keine zusätzlichen Schritte nötig
- Am schnellsten

**Option B: Eigene Gläubiger-ID**
- Wenn du bereits eine Gläubiger-ID von deiner Bank hast
- Eingabe der ID im Dashboard

**Empfehlung**: Nutze die Stripe-verwaltete ID für den Start.

### 5. Mandatstext konfigurieren (optional)

Du kannst den Text anpassen, der Kunden beim SEPA-Mandat angezeigt wird:
- Standard-Text ist bereits rechtlich konform
- Anpassungen sind optional
- Muss rechtliche Anforderungen erfüllen

### 6. Aktivierung abschließen

1. Klicke auf **Aktivieren** oder **Speichern**
2. SEPA ist jetzt für dein Live-Konto aktiviert

### 7. Code anpassen

Nachdem SEPA aktiviert ist, aktualisiere den Code:

**Datei**: `src/app/api/stripe/checkout/route.ts`

```typescript
const sessionParams: Stripe.Checkout.SessionCreateParams = {
  mode: 'subscription',
  payment_method_types: ['card', 'sepa_debit'], // SEPA wieder hinzufügen
  // ... rest of config
};
```

Ändere Zeile 65 von:
```typescript
payment_method_types: ['card'], // Add 'sepa_debit' after activating SEPA in Stripe Dashboard
```

Zu:
```typescript
payment_method_types: ['card', 'sepa_debit'],
```

### 8. Testen

Nach der Aktivierung:

1. Teste den Checkout-Flow
2. Wähle "Lastschrift" als Zahlungsmethode
3. Gib eine Test-IBAN ein (nur im Test-Modus):
   - Deutschland: `DE89370400440532013000`
   - Österreich: `AT611904300234573201`

## Wichtige Hinweise

### Auszahlungszeiten

- **Kreditkarte**: Sofort (Geld nach ~7 Tagen auf deinem Konto)
- **SEPA Lastschrift**: Verzögert (erste Abbuchung nach ~14 Tagen)

### Rückbuchungen (Chargebacks)

SEPA-Lastschrift hat höhere Rückbuchungsraten:
- Kunden können innerhalb von 8 Wochen zurückbuchen (ohne Angabe von Gründen)
- Bei unautorisierter Abbuchung: bis zu 13 Monate

**Tipp**: Klare Kommunikation reduziert Rückbuchungen:
- Deutliche Produktbeschreibung
- Klare Rechnungen/E-Mails
- Guter Kundenservice

### Compliance

SEPA erfordert:
- ✅ Klare Mandatsreferenz (automatisch von Stripe generiert)
- ✅ Gläubiger-ID (von Stripe bereitgestellt)
- ✅ Pre-Notification (Stripe sendet automatisch)
- ✅ Datenschutz-konform (DSGVO)

Stripe übernimmt diese Compliance automatisch.

## Kosten

Stripe-Gebühren für SEPA:
- **0,35% + 0,25 €** pro erfolgreicher Transaktion
- Deutlich günstiger als Kreditkarten (1,4% + 0,25 €)

Bei vielen Transaktionen kann SEPA erhebliche Kosten sparen!

## Alternativen & weitere Zahlungsmethoden

Weitere beliebte Zahlungsmethoden in Deutschland:

### PayPal
```typescript
payment_method_types: ['card', 'sepa_debit', 'paypal'],
```

### Google Pay / Apple Pay
```typescript
payment_method_types: ['card', 'sepa_debit'],
// Wird automatisch angezeigt, wenn verfügbar
```

### Klarna (Buy now, pay later)
```typescript
payment_method_types: ['card', 'sepa_debit', 'klarna'],
```

**Aktivierung**: Alle in **Einstellungen** → **Zahlungsmethoden** im Stripe Dashboard

## Troubleshooting

### "SEPA ist aktiviert, aber wird nicht im Checkout angezeigt"

**Lösung:**
1. Checke, ob Code aktualisiert wurde (`payment_method_types: ['card', 'sepa_debit']`)
2. Server neu starten (`npm run dev`)
3. Cache löschen und Seite neu laden
4. Prüfe, ob Stripe Live-Keys verwendet werden (nicht Test-Keys)

### "SEPA-Zahlung wurde abgelehnt"

**Mögliche Gründe:**
- IBAN ist ungültig
- Bankkonto hat nicht genug Deckung
- Bank lehnt Lastschrift ab (selten)

**Lösung:**
- Kunden bitten, andere Zahlungsmethode zu verwenden
- Kontodaten überprüfen lassen

### "Webhook-Events für SEPA funktionieren nicht"

**Zusätzliche Events für SEPA:**
- `payment_intent.succeeded` (erfolgreiche SEPA-Zahlung)
- `payment_intent.payment_failed` (fehlgeschlagene SEPA-Zahlung)
- `charge.failed` (Lastschrift wurde zurückgewiesen)

Stelle sicher, dass dein Webhook-Handler diese Events verarbeitet.

## Monitoring & Analytics

Nach SEPA-Aktivierung überwachen:

1. **Conversion-Rate**: Steigt sie mit SEPA?
2. **Rückbuchungen**: Wie viele SEPA-Rückbuchungen gibt es?
3. **Bevorzugte Zahlungsmethode**: Nutzen Kunden SEPA oder Kreditkarte?

**Stripe Dashboard** → **Zahlungen** → **Zahlungsmethoden** zeigt diese Statistiken.

## Best Practices

1. **Biete immer mehrere Zahlungsmethoden an**
   - Mindestens: Kreditkarte + SEPA
   - Optional: PayPal, Klarna, etc.

2. **Klare Kommunikation**
   - Erkläre, wann die erste Abbuchung erfolgt
   - Sende Bestätigungs-E-Mails
   - Informiere vor jeder Abbuchung (Stripe macht das automatisch)

3. **Testen, testen, testen**
   - Teste SEPA im Test-Modus gründlich
   - Mache mindestens eine echte Test-Zahlung im Live-Modus

4. **Kundenservice**
   - Reagiere schnell auf SEPA-bezogene Fragen
   - Hilf bei Rückbuchungen proaktiv

## Nächste Schritte

- [ ] SEPA in Stripe Dashboard aktiviert
- [ ] Geschäftsinformationen bestätigt
- [ ] Code angepasst (`payment_method_types` aktualisiert)
- [ ] Server neu gestartet
- [ ] Checkout-Flow getestet
- [ ] SEPA-Zahlung erfolgreich durchgeführt
- [ ] Webhook-Events für SEPA geprüft

## Support

Bei Fragen zur SEPA-Aktivierung:
- Stripe Support kontaktieren (exzellenter Service!)
- Live Chat im Stripe Dashboard
- https://support.stripe.com
