# Supabase Setup Anleitung

## 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Warte bis das Projekt fertig ist (~2 Minuten)

## 2. Database Schema einrichten

1. Gehe zu **SQL Editor** in deinem Supabase Dashboard
2. Erstelle eine "New Query"
3. Kopiere den Inhalt von `supabase-schema.sql`
4. Führe die Query aus (Run)

Das erstellt:
- `analyses` Tabelle für gespeicherte Analysen
- `user_premium_usage` Tabelle für Premium-Status
- Indexes für Performance
- Row Level Security Policies
- Auto-update Triggers für `updated_at`

## 3. API Keys kopieren

1. Gehe zu **Settings** → **API**
2. Kopiere folgende Werte:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (⚠️ geheim halten!)
```

## 4. Environment Variables setzen

Erstelle eine `.env.local` Datei im Root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk (solltest du schon haben)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI (solltest du schon haben)
OPENAI_API_KEY=sk-...
```

## 5. App neu starten

```bash
npm run dev
```

## 6. Testen

1. Erstelle eine neue Analyse
2. Klicke auf "Ergebnis speichern"
3. Gehe zum Dashboard
4. Die Analyse sollte in der Liste erscheinen
5. Klicke auf "Öffnen" - die Daten sollten geladen werden

## Migration von localStorage zu Supabase

Wenn du bereits Analysen in localStorage hast:

1. Die App wird automatisch localStorage nutzen wenn Supabase nicht konfiguriert ist
2. Nach Supabase Setup: Alte Analysen manuell neu speichern
3. Oder: Migrationsskript nutzen (TODO)

## Nächste Schritte

- [ ] Supabase Projekt erstellt
- [ ] Schema deployed
- [ ] Environment Variables gesetzt
- [ ] Test: Analyse speichern
- [ ] Test: Analyse laden
- [ ] Test: Dashboard zeigt Analysen

## Troubleshooting

**"Supabase credentials not found"**
- Checke ob `.env.local` existiert
- Checke ob alle 3 Supabase Variablen gesetzt sind
- Restart dev server

**"Row Level Security policy violation"**
- Checke ob RLS Policies korrekt sind
- Teste mit service_role key (nur für debugging!)

**Analysen werden nicht gespeichert**
- Öffne Browser Console für Fehler
- Checke Network Tab für API Calls
- Checke Supabase Dashboard → Table Editor

## Support

Bei Problemen:
1. Supabase Logs checken: Dashboard → Logs
2. Browser Console checken
3. Network Tab checken
