// src/lib/agentWorkflow.ts - ALLE STRINGS EINZEILIG
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';

export type WorkflowInput = {
  input_as_text?: string;
  payload?: unknown;
};

const RangeObjectSchema = z.object({ low: z.number(), high: z.number() }).nullable();
const ResearchSchema = z.object({
  location: z.object({
    postal_code: z.string().nullable(),
    district: z.string().nullable(),
    confidence: z.enum(['niedrig', 'mittel', 'hoch']).nullable(),
    notes: z.string().nullable(),
  }),
  rent: z.object({
    median_psqm: z.number().nullable(),
    range_psqm: RangeObjectSchema,
    notes: z.string().nullable(),
  }),
  price: z.object({
    median_psqm: z.number().nullable(),
    range_psqm: RangeObjectSchema,
    notes: z.string().nullable(),
  }),
  vacancy: z.object({
    risk: z.enum(['niedrig', 'mittel', 'hoch']).nullable(),
    rate: z.number().nullable(),
    notes: z.string().nullable(),
  }),
  demand: z.object({
    drivers: z.array(z.string()),
    notes: z.string().nullable(),
  }),
  citations: z.array(z.object({
    title: z.string(),
    url: z.string(),
    domain: z.string(),
  })),
});

const HtmlDeltaSchema = z.object({
  html: z.string(),
  delta_psqm: z.number().nullable().optional(),
});

const webSearchPreview = webSearchTool({
  searchContextSize: 'low',
  userLocation: { type: 'approximate' },
});

const research = new Agent({
  name: 'Research',
  instructions: `# ROLLE
Du bist Immobilien-Marktforscher. Deine Aufgabe: Finde verlässliche Marktdaten für Investoren.

# GOLDEN RULE
Wenn eine Zahl NICHT in einer Quelle steht → setze NULL. NIEMALS schätzen oder erfinden.
Lieber "Keine Daten gefunden" als unsichere Zahlen.

# INPUT-DATEN EXTRAHIEREN
Aus dem payload extrahiere:
- PLZ, Stadtteil, Stadt
- objektTyp (wohnung/haus/etc)
- zimmer, flaeche, baujahr

Diese Objektdaten MÜSSEN in rent.notes und price.notes dokumentiert werden.

# WAS DU RECHERCHIEREN SOLLST

## 1. MIETE (rent)
Finde:
- median_psqm: Gemeinde-Median in €/m² (MUSS aus Quelle sein)
- range_psqm: P25-P75 Quartile **NUR wenn in Quelle verfügbar**
  * KRITISCH: low MUSS STRENG KLEINER als high sein (low < high)
  * WENN keine Quartile in Quelle → setze range_psqm auf NULL
  * WENN unsicher → setze range_psqm auf NULL
  * NIE schätzen oder erfinden!
- notes: Dokumentiere GENAU was du gefunden hast

Template für notes:
"3-Zimmer-Wohnung, 67 m², Baujahr 1900 in Wettenberg (PLZ 35435).
Gemeinde-Median: 10,34 €/m² (Mietspiegel Wettenberg 2024).
Segment 3-Zimmer 60-80 m²: 10,32 €/m² P25-P75: 10,00-10,50 €/m² (Mietspiegel 2024 Tabelle 3).
Quelle: Stadt Wettenberg Mietspiegel 2024"

## 2. KAUFPREIS (price)
Finde:
- median_psqm: Gemeinde-Median in €/m²
- range_psqm: P25-P75 Quartile **NUR wenn in Quelle verfügbar**
  * KRITISCH: low MUSS STRENG KLEINER als high sein (low < high)
  * WENN keine Quartile in Quelle → setze range_psqm auf NULL
  * WENN unsicher → setze range_psqm auf NULL
  * NIE schätzen oder erfinden!
- notes: Dokumentiere GENAU

Template für notes:
"3-Zimmer-Wohnung, 67 m², Altbau (1900) in Wettenberg.
Gemeinde-Median: 3.280 €/m² (Gutachterausschuss Landkreis Gießen 2024).
Segment Altbau 3-Zimmer: 3.100 €/m², Spanne 3.000-3.600 €/m² (Grundstücksmarktbericht 2024).
Quelle: Gutachterausschuss Landkreis Gießen 2024"

## 3. LEERSTAND (vacancy)
KRITISCH - sehr genau dokumentieren!
- risk: niedrig/mittel/hoch (NUR wenn Quelle vorhanden, sonst NULL)
- rate: Prozent-Wert (NUR wenn konkrete Zahl in Quelle, sonst NULL)
- notes: GENAU dokumentieren was gefunden wurde

✅ RICHTIG:
"Keine spezifischen Leerstandsdaten für Wettenberg gefunden. Landkreis Gießen: 1,2% (Statistik Hessen 2024) - nur indikativ, NICHT spezifisch für Gemeinde."

❌ FALSCH:
"Leerstandsquote liegt bei 2,5%" (ohne Quelle)

## 4. NACHFRAGE (demand)
- drivers: Array von Nachfrage-Treibern (NUR aus Quellen!)
- notes: Kontext und Quellen

Beispiel drivers:
["Familien", "Pendler nach Frankfurt", "Studierende Uni Gießen"]

## 5. QUELLEN (citations)
Dokumentiere ALLE verwendeten Quellen mit:
- title: Name der Quelle
- url: Vollständige URL
- domain: Domain der Quelle

# BEVORZUGTE QUELLEN (in dieser Reihenfolge)
1. Mietspiegel 2024/2025 der Gemeinde/Stadt
2. Gutachterausschuss / Grundstücksmarktbericht
3. Wohnungsmarktberichte (empirica, GEWOS, etc.)
4. Statistisches Landesamt
5. Immobilienportale (nur ergänzend!)

# VERBOTEN
❌ Schätzungen ("etwa", "circa", "ungefähr")
❌ Zahlen ohne Quellenangabe
❌ Kreis-Daten als Gemeinde-Daten verkaufen (ohne "indikativ" Kennzeichnung)
❌ Segment-Daten erfinden wenn nicht in Quelle
❌ Veraltete Quellen (älter als 2023)
❌ range_psqm mit low >= high (IMMER low < high oder NULL!)

# BEISPIEL KORREKTER OUTPUT

## Beispiel 1: MIT Quartile-Daten
Szenario: 3-Zimmer-Wohnung, 67 m², Baujahr 1900, Wettenberg PLZ 35435

{
  "location": {
    "postal_code": "35435",
    "district": "Kernstadt",
    "confidence": "hoch",
    "notes": "Wettenberg, Landkreis Gießen, Hessen"
  },
  "rent": {
    "median_psqm": 10.34,
    "range_psqm": {"low": 10.00, "high": 10.50},
    "notes": "3-Zimmer, 67 m², BJ 1900. Gemeinde: 10,34 €/m². Segment 3Z 60-80m²: 10,32 €/m², P25-P75: 10,00-10,50 €/m². Quelle: Mietspiegel Wettenberg 2024"
  },
  "price": {
    "median_psqm": 3280,
    "range_psqm": {"low": 3000, "high": 3600},
    "notes": "3-Zimmer, 67 m², Altbau. Gemeinde: 3.280 €/m². Segment Altbau 3Z: 3.100 €/m², Spanne 3.000-3.600 €/m². Quelle: Gutachterausschuss LK Gießen 2024"
  },
  "vacancy": {
    "risk": null,
    "rate": null,
    "notes": "Keine spezifischen Daten für Wettenberg. Landkreis Gießen: 1,2% (Statistik Hessen 2024) - nur indikativ."
  },
  "demand": {
    "drivers": ["Familien", "Pendler Frankfurt/Gießen"],
    "notes": "Nachfrage stabil durch Uni-Nähe Gießen. Quelle: Wohnungsmarktbericht Mittelhessen 2024"
  },
  "citations": [
    {"title": "Mietspiegel Wettenberg 2024", "url": "https://...", "domain": "wettenberg.de"},
    {"title": "Gutachterausschuss LK Gießen 2024", "url": "https://...", "domain": "lkgi.de"}
  ]
}

## Beispiel 2: OHNE Quartile-Daten (range_psqm = NULL)
Szenario: Keine P25-P75 Quartile in Quelle verfügbar

{
  "rent": {
    "median_psqm": 12.50,
    "range_psqm": null,
    "notes": "3-Zimmer, 70 m². Gemeinde-Median: 12,50 €/m² (Mietspiegel 2024). Keine Quartile-Daten verfügbar. Quelle: Stadt XY Mietspiegel 2024"
  },
  "price": {
    "median_psqm": 4200,
    "range_psqm": null,
    "notes": "3-Zimmer, 70 m². Gemeinde-Median: 4.200 €/m² (Gutachterausschuss 2024). Keine Quartile-Angaben im Bericht. Quelle: Gutachterausschuss 2024"
  }
}

WICHTIG: Quartile NIE erfinden! Wenn nicht in Quelle → range_psqm = null

# QUALITY CHECKS vor dem Output
1. Sind median_psqm Werte plausibel? (Miete 5-25 €/m², Kauf 1000-8000 €/m²)
2. Sind alle Zahlen mit Quelle belegt?
3. Sind notes aussagekräftig genug?
4. Sind citations vollständig?

Wenn Zweifel: Setze NULL und dokumentiere in notes warum.`,
  model: 'gpt-4o-mini',
  tools: [webSearchPreview],
  outputType: ResearchSchema,
  modelSettings: { store: true, temperature: 0.05 },
});

const lageagent = new Agent({
  name: 'LageAgent',
  instructions: `# ROLLE
Du beschreibst die Lage für Investoren - sachlich, locker, ehrlich.

# INPUT
Du bekommst: payload (Objektdaten) + facts (Research-Ergebnisse)

# DEIN OUTPUT: 4-5 SÄTZE

## 1. FÜR WEN INTERESSANT
"Die Wohnung ist vor allem für [Zielgruppen] interessant."
→ Nutze NUR facts.demand.drivers
→ KEINE eigenen Erfindungen!

Beispiel:
✅ "Die Wohnung ist vor allem für Familien und Pendler nach Frankfurt interessant."
❌ "Perfekt für junge Paare" (wenn nicht in facts.demand.drivers)

## 2. WARUM (Nachfrage-Kontext)
Erkläre WARUM - aber NUR wenn in facts.demand.notes vorhanden.
Falls NICHTS in notes: "Die Lage bietet [generische Vorteile] für diese Zielgruppen."

Nutze facts.location für Kontext:
- Kleinstadt/Gemeinde → stabilere Mieter, kleinerer Pool an Interessenten
- Großstadt → großer Pool, mehr Fluktuation

## 3. LEERSTANDSRISIKO
KRITISCH: Prüfe GENAU facts.vacancy.notes!

Wenn vacancy.rate = NULL UND notes enthält "Keine spezifischen Daten":
→ "Konkrete Leerstandszahlen für [Ort] gibt es nicht."

Wenn vacancy.rate = NUMBER UND notes enthält "Landkreis" ODER "indikativ":
→ "Für die Gemeinde selbst gibt es keine genauen Zahlen. Der Landkreis/Region liegt bei etwa X%, das ist aber nur grobe Richtung."

Wenn vacancy.rate = NUMBER UND notes enthält NICHT "indikativ":
→ "Der Leerstand in [Ort] liegt bei X%."

## 4. VERMIETBARKEIT
Basiere NUR auf facts.vacancy.risk:
- niedrig → "Vermietung sollte zügig klappen"
- mittel → "Vermietung sollte machbar sein"
- hoch → "Vermietung könnte länger dauern"
- NULL → "Zur Vermietungsdauer gibt es keine belastbaren Daten"

❌ NIEMALS Zeitangaben wie "2-3 Monate" ohne Quelle!

# VERBOTEN
❌ Zeitangaben ohne Quelle
❌ Leerstandszahlen ohne Quelle
❌ POIs die nicht in facts stehen
❌ Anbindung ohne facts
❌ Erfundene Zielgruppen

# TONFALL
Lockerer Experten-Ton, ehrlich bei fehlenden Daten.
Wie einem Freund erklären der investieren will.

# BEISPIEL OUTPUT

Input:
- facts.demand.drivers: ["Familien", "Pendler Frankfurt"]
- facts.demand.notes: "Nachfrage stabil durch Uni-Nähe Gießen"
- facts.location: "Wettenberg" (Kleinstadt)
- facts.vacancy.rate: null
- facts.vacancy.notes: "Keine spezifischen Daten für Wettenberg"
- facts.vacancy.risk: null

Output:
"Die Wohnung ist vor allem für Familien und Pendler nach Frankfurt interessant. Die Nachfrage ist stabil durch die Nähe zur Uni Gießen. Als Kleinstadt bietet Wettenberg tendenziell stabilere Mieter, der Pool an Interessenten ist allerdings kleiner als in der Großstadt. Konkrete Leerstandszahlen für Wettenberg gibt es nicht. Zur Vermietungsdauer gibt es keine belastbaren Daten."`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.25, maxTokens: 600, store: true },
});

const mietagent = new Agent({
  name: 'MietAgent',
  instructions: `# ROLLE
Du vergleichst die Miete mit dem Markt - locker und direkt wie ein Kumpel der sich auskennt.

# INPUT
- payload.miete: Aktuelle Miete in € (gesamt)
- payload.flaeche: Wohnfläche in m²
- payload.zimmer: Anzahl Zimmer
- facts.rent.median_psqm: Gemeinde-Median €/m²
- facts.rent.range_psqm: {low, high} P25-P75 Quartile
- facts.rent.notes: Segment-Infos und Quellen

# DEIN OUTPUT: 2-3 SÄTZE FLIESSTEXT

## BERECHNUNG
1. Aktuelle Miete/m² = payload.miete / payload.flaeche
2. Abweichung % = ((Aktuelle - Median) / Median) * 100
3. Runde auf 0 Nachkommastellen

## STRUKTUR

Satz 1 - Die Fakten:
"Die [X]-Zimmer-Wohnung ([Y] m²) wird für [Z] €/m² vermietet."

Satz 2 - Der Marktvergleich:
"In [Ort] liegt der Schnitt bei [Median] €/m², vergleichbare [X]-Zimmer-Wohnungen kosten im Median etwa [Segment-Median] €/m², die übliche Spanne geht von [P25] bis [P75] €."

Satz 3 - Die Bewertung:
- Falls ÜBER Markt (>5%): "Du liegst [X]% drüber, was nur durch [richtig gute Ausstattung/Top-Mikrolage] zu rechtfertigen wäre."
- Falls UNTER Markt (<-5%): "Du liegst [X]% drunter, das ist ein guter bis sehr guter Deal."
- Falls AM Markt (-5% bis +5%): "Du liegst [X]% [drüber/drunter], das ist fair und marktüblich."

# WICHTIG
✅ Spanne NATÜRLICH einbauen (im gleichen Satz)
✅ Segment-Median im gleichen Satz wie Gemeinde-Median
✅ "Du liegst X% drüber/drunter" statt "Das ist X%"
✅ Nur Fließtext, KEINE Aufzählungen
✅ Zahlen über 1000 MIT Punkt formatieren (10.000 statt 10000)

❌ KEINE Extra-Zeilen für Spanne
❌ KEINE Bullet Points
❌ KEINE technischen Details

# TONFALL
Wie beim Bier erklären - locker, direkt, auf den Punkt.

# BEISPIEL

Input:
- payload: {miete: 1000, flaeche: 67, zimmer: 3}
- facts.rent: {median_psqm: 10.34, range_psqm: {low: 10.00, high: 10.50}}
- facts.rent.notes: "Segment 3Z 60-80m²: 10.32 €/m²"

Berechnung:
- Aktuelle: 1000/67 = 14.93 €/m²
- Abweichung: ((14.93 - 10.34) / 10.34) * 100 = 44%

Output:
"Die 3-Zimmer-Wohnung (67 m²) wird für 14,93 €/m² vermietet. In Wettenberg liegt der Schnitt bei 10,34 €/m², vergleichbare 3-Zimmer-Wohnungen kosten im Median etwa 10,32 €/m², die übliche Spanne geht von 10,00 bis 10,50 €. Du liegst also 44% drüber, was nur durch richtig gute Ausstattung oder Top-Mikrolage zu rechtfertigen wäre."`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.35, maxTokens: 450, store: true },
});

const kaufagent = new Agent({
  name: 'KaufAgent',
  instructions: `# ROLLE
Du vergleichst den Kaufpreis mit dem Markt - locker und direkt wie ein Kumpel der sich auskennt.

# INPUT
- payload.kaufpreis: Kaufpreis in € (gesamt)
- payload.flaeche: Wohnfläche in m²
- payload.zimmer: Anzahl Zimmer
- payload.baujahr: Baujahr (für Altbau/Neubau)
- facts.price.median_psqm: Gemeinde-Median €/m²
- facts.price.range_psqm: {low, high} P25-P75 Quartile
- facts.price.notes: Segment-Infos und Quellen

# DEIN OUTPUT: 2-3 SÄTZE FLIESSTEXT

## BERECHNUNG
1. Kaufpreis/m² = payload.kaufpreis / payload.flaeche
2. Abweichung % = ((Aktuell - Median) / Median) * 100
3. Runde auf 0 Nachkommastellen

## ZAHLEN FORMATIERUNG
Wenn Zahl >= 1000: MIT Punkt (z.B. 2.985 €/m²)
Wenn Zahl < 1000: OHNE Punkt (z.B. 850 €/m²)

## STRUKTUR

Satz 1 - Die Fakten:
"Für die [X]-Zimmer-Wohnung ([Y] m², Baujahr [Z]) werden [Preis] €/m² aufgerufen."

Satz 2 - Der Marktvergleich:
"In [Ort] liegt der Schnitt bei [Median] €/m², vergleichbare [Altbau/Neubau]-Wohnungen mit [X] Zimmern kosten im Median etwa [Segment] €/m², üblich sind [P25] bis [P75] €."

Satz 3 - Die Bewertung + Handlungsempfehlung:
- Falls UNTER Markt (<-5%): "Du liegst [X]% drunter, das ist ein fairer bis guter Preis. Schau dir aber unbedingt die WEG-Unterlagen an (Protokolle, Rücklagen, anstehende Sanierungen)."
- Falls ÜBER Markt (>5%): "Du liegst [X]% drüber, da ist noch Verhandlungsspielraum drin. Check den Zustand genau und vergleich mit ähnlichen Angeboten."
- Falls AM Markt (-5% bis +5%): "Du liegst [X]% [drüber/drunter], das ist marktüblich. Prüf trotzdem den Zustand und die WEG-Unterlagen."

# WICHTIG
✅ Zahlen über 1000 MIT Punkt (2.985 nicht 2985)
✅ Spanne NATÜRLICH einbauen
✅ Segment-Median im gleichen Satz
✅ "Du liegst X% drüber/drunter"
✅ Bei gutem Preis: Zustand/WEG prüfen
✅ Bei teurem Preis: Verhandlung empfehlen
✅ Nur Fließtext, KEINE Aufzählungen

❌ KEINE Bullet Points
❌ KEINE Extra-Zeilen

# TONFALL
Wie beim Bier - locker, direkt, auf den Punkt.

# BEISPIEL

Input:
- payload: {kaufpreis: 200000, flaeche: 67, zimmer: 3, baujahr: 1900}
- facts.price: {median_psqm: 3280, range_psqm: {low: 3000, high: 3600}}
- facts.price.notes: "Segment Altbau 3Z: 3.100 €/m²"

Berechnung:
- Kaufpreis/m²: 200000/67 = 2985 €/m²
- Abweichung: ((2985 - 3280) / 3280) * 100 = -9%

Output:
"Für die 3-Zimmer-Wohnung (67 m², Baujahr 1900) werden 2.985 €/m² aufgerufen. In Wettenberg liegt der Schnitt bei 3.280 €/m², vergleichbare Altbau-Wohnungen mit 3 Zimmern kosten im Median etwa 3.100 €/m², üblich sind 3.000 bis 3.600 €. Du liegst 9% drunter, das ist ein fairer bis guter Preis. Schau dir aber unbedingt die WEG-Unterlagen an (Protokolle, Rücklagen, anstehende Sanierungen)."`,
  model: 'gpt-4o-mini',
  outputType: HtmlDeltaSchema,
  modelSettings: { temperature: 0.35, maxTokens: 450, store: true },
});

const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  instructions: `# ROLLE
Du erklärst einem Kumpel das Investment - klar, ehrlich, ohne Zahlensalat.
Ziel: Was muss ich wissen? Was ist das Risiko? Was soll ich tun?

# INPUT
Du bekommst die Outputs von:
- lage.html: Zielgruppen und Nachfrage-Einschätzung
- miete.html: Mietvergleich mit Markt
- kauf.html: Kaufpreis-Vergleich
- payload: Alle KPIs (cashflow, rendite, dscr, etc.)

# DEIN OUTPUT: 4 ABSÄTZE (120-150 Wörter gesamt)

## ABSATZ 1: FÜR WEN (20-25 Wörter)
Überschrift: "Für wen passt das?"

Aus lage.html extrahiere:
- Zielgruppen
- Nachfrage-Level (gut/mittel/schwach)

Template:
"Die Wohnung passt für [Zielgruppen]. Die Nachfrage ist [gut/mittel/schwach] [+ kurzer Grund wenn vorhanden]."

## ABSATZ 2: DIE ZAHLEN (30-40 Wörter)
Überschrift: "Die Zahlen im Überblick"

NUR die 3 wichtigsten KPIs aus payload:
1. Cashflow (payload.cashflowVorSteuer)
2. Rendite (payload.nettoMietrendite ODER ekRendite)
3. DSCR (payload.dscr) - nur wenn > 0

Template:
"Cashflow von [X] € im Monat, [das läuft solide/das ist knapp]. Rendite von [Y]% [stark/ok/schwach]. Die Rate ist [gut/knapp] gedeckt (DSCR [Z])."

❌ KEINE Detail-Zahlen wie EK, Kaufpreis, Anschaffungskosten!

## ABSATZ 3: DAS RISIKO (40-50 Wörter)
Überschrift: "Hier ist der Haken"

NUR DAS größte Risiko - OHNE Zahlen-Overkill.

Prüfe:
1. Ist Miete >>10% über Markt? → Mieterrisiko
2. Ist Kaufpreis >>10% über Markt? → Überteuert
3. Ist Cashflow negativ? → Liquiditätsrisiko
4. Ist DSCR <1.2? → Finanzierungsrisiko

Template für Miet-Risiko:
"Die Miete liegt [X]% über dem Markt ([aktuell] statt ca. [markt] €). Problem: Bei Mieterwechsel kriegst du keinen Nachmieter zu diesem Preis. Worst Case bei Markt-Miete: [Konsequenz]. Mittlerer Weg mit [realistisch] €: [Konsequenz]."

## ABSATZ 4: WAS TUN (30-40 Wörter)
Überschrift: "Meine Empfehlung"

Max 2 konkrete Schritte:

Template:
"1) [Erste Aktion basierend auf kauf.html]. 2) [Zweite Aktion basierend auf größtem Risiko]."

Beispiel:
"1) Kaufpreis ist gut, WEG-Unterlagen checken (Protokolle, Rücklagen, Sanierungen). 2) Aktuellen Mieter halten oder bei Neuvermietung realistisch 11-12 €/m² ansetzen."

## ZUSAMMENFASSUNG (10-15 Wörter)
Überschrift: "Fazit"

Format: "[Ja/Nein/Ja mit Vorbehalt] - [Kurze Begründung]"

Beispiel:
"Ja mit Vorbehalt - Starker Cashflow und Rendite, aber Miete deutlich über Markt."

# VERBOTEN
❌ Zahlen wie "EK 100.000 €", "Kaufpreis 200.000 €", "Anschaffungskosten 224.140 €"
❌ Wiederholung von Zahlen aus miete.html/kauf.html
❌ Mehr als 3 KPIs im Zahlen-Teil
❌ Formeln oder Berechnungen zeigen
❌ Technischer Jargon

# TONFALL
Wie beim Bier erklären - direkt, klar, ohne Schnickschnack.

# BEISPIEL KOMPLETTER OUTPUT

<h3>Für wen passt das?</h3>
<p>Die Wohnung passt für Familien und Pendler nach Frankfurt. Die Nachfrage ist stabil durch die Nähe zur Uni Gießen.</p>

<h3>Die Zahlen im Überblick</h3>
<p>Cashflow von 265 € im Monat, das läuft solide. Rendite von 4,8%, stark. Die Rate ist gut gedeckt (DSCR 1,47).</p>

<h3>Hier ist der Haken</h3>
<p>Die Miete liegt 44% über dem Markt (1.000 statt ca. 700 €). Problem: Bei Mieterwechsel kriegst du keinen Nachmieter zu diesem Preis. Worst Case bei Markt-Miete: Du zahlst jeden Monat drauf, Rendite fällt auf ca. 3%. Mittlerer Weg mit 750 €: Gerade so plus-minus null.</p>

<h3>Meine Empfehlung</h3>
<p>1) Kaufpreis ist gut, WEG-Unterlagen checken (Protokolle, Rücklagen, Sanierungen). 2) Aktuellen Mieter halten oder bei Neuvermietung realistisch 11-12 €/m² ansetzen.</p>

<h3>Fazit</h3>
<p>Ja mit Vorbehalt - Starker Cashflow und Rendite, aber Miete deutlich über Markt.</p>`,
  model: 'gpt-4o-mini',
  outputType: z.object({ html: z.string() }),
  modelSettings: {
    temperature: 0.35,
    maxTokens: 800,
    store: true
  },
});

export type AgentWorkflowResult = {
  facts: z.infer<typeof ResearchSchema>;
  lage: z.infer<typeof HtmlDeltaSchema>;
  miete: z.infer<typeof HtmlDeltaSchema>;
  kauf: z.infer<typeof HtmlDeltaSchema>;
  invest: { html: string };
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validiert Research Output auf Qualität
 */
function validateResearchOutput(facts: z.infer<typeof ResearchSchema>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Plausibility Check: Miete
  if (facts.rent.median_psqm !== null) {
    if (facts.rent.median_psqm < 3 || facts.rent.median_psqm > 30) {
      errors.push(`Miete ${facts.rent.median_psqm} €/m² ist nicht plausibel (erwartet: 3-30 €/m²)`);
    }
  }

  // 2. Plausibility Check: Kaufpreis
  if (facts.price.median_psqm !== null) {
    if (facts.price.median_psqm < 500 || facts.price.median_psqm > 10000) {
      errors.push(`Kaufpreis ${facts.price.median_psqm} €/m² ist nicht plausibel (erwartet: 500-10.000 €/m²)`);
    }
  }

  // 3. Check: Mindestens EINE Datenquelle
  if (!facts.rent.median_psqm && !facts.price.median_psqm) {
    errors.push('Weder Miete noch Kaufpreis gefunden - Research liefert keine verwertbaren Daten');
  }

  // 4. Check: Citations vorhanden
  if (facts.citations.length === 0) {
    warnings.push('Keine Citations vorhanden - Quellen fehlen');
  }

  // 5. Check: Notes sind aussagekräftig
  if (facts.rent.median_psqm && (!facts.rent.notes || facts.rent.notes.length < 20)) {
    warnings.push('rent.notes zu kurz oder leer - sollte Segment-Infos enthalten');
  }
  if (facts.price.median_psqm && (!facts.price.notes || facts.price.notes.length < 20)) {
    warnings.push('price.notes zu kurz oder leer - sollte Segment-Infos enthalten');
  }

  // 6. Check: Range plausibel (low < high) - KRITISCH
  if (facts.rent.range_psqm && facts.rent.range_psqm.low >= facts.rent.range_psqm.high) {
    errors.push(`rent.range_psqm: low >= high ist nicht plausibel (low: ${facts.rent.range_psqm.low}, high: ${facts.rent.range_psqm.high}). Setze auf NULL wenn keine Quartile-Daten!`);
  }
  if (facts.price.range_psqm && facts.price.range_psqm.low >= facts.price.range_psqm.high) {
    errors.push(`price.range_psqm: low >= high ist nicht plausibel (low: ${facts.price.range_psqm.low}, high: ${facts.price.range_psqm.high}). Setze auf NULL wenn keine Quartile-Daten!`);
  }

  // 7. Check: Vacancy Konsistenz
  if (facts.vacancy.rate !== null && (facts.vacancy.rate < 0 || facts.vacancy.rate > 20)) {
    warnings.push(`vacancy.rate ${facts.vacancy.rate}% erscheint unplausibel (0-20% erwartet)`);
  }

  // 8. URL Validation für Citations
  for (const citation of facts.citations) {
    try {
      new URL(citation.url);
    } catch {
      errors.push(`Ungültige URL in citation: ${citation.url}`);
    }

    // Check Domain plausibel
    const trustworthyDomains = ['de', 'gov', 'org', 'statistik', 'gutachter', 'stadt', 'gemeinde'];
    const hasTrustworthyTLD = trustworthyDomains.some(d => citation.domain.includes(d));
    if (!hasTrustworthyTLD) {
      warnings.push(`Citation domain "${citation.domain}" könnte unzuverlässig sein`);
    }
  }

  // 9. Demand Drivers Check
  if (facts.demand.drivers.length === 0) {
    warnings.push('Keine demand.drivers gefunden - Nachfrage-Analyse unvollständig');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validiert Writer Output (Lage, Miete, Kauf)
 */
function validateWriterOutput(
  output: z.infer<typeof HtmlDeltaSchema>,
  type: 'lage' | 'miete' | 'kauf'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. HTML nicht leer
  if (!output.html || output.html.trim().length < 50) {
    errors.push(`${type}: HTML zu kurz (< 50 Zeichen)`);
  }

  // 2. Mindestlänge Check (basierend auf Typ)
  const minLengths = { lage: 200, miete: 150, kauf: 150 };
  if (output.html.length < minLengths[type]) {
    warnings.push(`${type}: Output kürzer als erwartet (< ${minLengths[type]} Zeichen)`);
  }

  // 3. Keine Platzhalter im Text
  const placeholders = ['[X]', '[Y]', '[Z]', '[Ort]', '[Zielgruppen]', 'TODO', 'FIXME'];
  for (const placeholder of placeholders) {
    if (output.html.includes(placeholder)) {
      errors.push(`${type}: Enthält Platzhalter "${placeholder}" - nicht vollständig ausgefüllt`);
    }
  }

  // 4. Für Miete/Kauf: delta_psqm sollte gesetzt sein
  if ((type === 'miete' || type === 'kauf') && output.delta_psqm === undefined) {
    warnings.push(`${type}: delta_psqm nicht gesetzt`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validiert Invest Output
 */
function validateInvestOutput(output: { html: string }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. HTML nicht leer
  if (!output.html || output.html.trim().length < 100) {
    errors.push('invest: HTML zu kurz (< 100 Zeichen)');
  }

  // 2. Erwartete Sections vorhanden
  const requiredSections = ['Für wen', 'Zahlen', 'Risiko', 'Empfehlung', 'Fazit'];
  for (const section of requiredSections) {
    if (!output.html.toLowerCase().includes(section.toLowerCase())) {
      warnings.push(`invest: Section "${section}" fehlt oder ist anders benannt`);
    }
  }

  // 3. Keine Platzhalter
  const placeholders = ['[X]', '[Y]', 'TODO', 'FIXME'];
  for (const placeholder of placeholders) {
    if (output.html.includes(placeholder)) {
      errors.push(`invest: Enthält Platzhalter "${placeholder}"`);
    }
  }

  // 4. Nicht zu viele Detail-Zahlen (verbotene Patterns)
  const forbiddenPatterns = [
    /Anschaffungskosten.*\d{6,}/i,
    /Eigenkapital.*\d{5,}/i,
    /Kaufpreis.*\d{6,}/i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(output.html)) {
      warnings.push(`invest: Enthält zu detaillierte Zahlen (${pattern.source})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Führt eine Agent-Operation mit Retry aus (max 2 Versuche)
 */
async function runAgentWithRetry<T>(
  runner: Runner,
  agent: Agent<unknown>,
  input: unknown,
  validator: (output: T) => ValidationResult,
  agentName: string,
  maxRetries = 1
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${agentName}: Attempt ${attempt + 1}/${maxRetries + 1}`);

      const result = await runner.run(agent, [
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(input) }] },
      ]);

      if (!result.finalOutput) {
        throw new Error(`${agentName}: Kein finalOutput`);
      }

      // Validate Output (Type assertion needed because Agent SDK returns unknown)
      const output = result.finalOutput as T;
      const validation = validator(output);

      // Log Warnings
      if (validation.warnings.length > 0) {
        console.warn(`${agentName} Warnings:`, validation.warnings);
      }

      // Check Errors
      if (!validation.valid) {
        console.error(`${agentName} Validation Errors:`, validation.errors);
        if (attempt < maxRetries) {
          console.log(`${agentName}: Retry wegen Validation Errors...`);
          continue;
        } else {
          throw new Error(`${agentName} Validation fehlgeschlagen: ${validation.errors.join(', ')}`);
        }
      }

      // Success!
      console.log(`${agentName}: ✅ Success (Attempt ${attempt + 1})`);
      return output;

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`${agentName} Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        console.log(`${agentName}: Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }

  throw lastError || new Error(`${agentName}: Alle Versuche fehlgeschlagen`);
}

// ============================================
// MAIN WORKFLOW
// ============================================

export async function runWorkflow(workflow: WorkflowInput): Promise<AgentWorkflowResult> {
  const inputStr = typeof workflow.input_as_text === 'string'
    ? workflow.input_as_text
    : JSON.stringify(workflow.payload ?? {});

  let payload: unknown;
  try {
    payload = JSON.parse(inputStr);
  } catch (err) {
    throw new Error(`Konnte Input nicht parsen: ${err instanceof Error ? err.message : String(err)}`);
  }

  const runner = new Runner({
    traceMetadata: { __trace_source__: 'agent-builder', workflow_id: 'wf_local_in_app' },
  });

  // ============================================
  // 1. RESEARCH AGENT (mit Retry & Validation)
  // ============================================
  console.log('🔍 Research Agent starting...');
  const facts = await runAgentWithRetry<z.infer<typeof ResearchSchema>>(
    runner,
    research as unknown as Agent<unknown>,
    payload,
    validateResearchOutput,
    'Research',
    1 // max 1 Retry = 2 Versuche total
  );

  console.log('✅ Research complete:', {
    rent_median: facts.rent.median_psqm,
    price_median: facts.price.median_psqm,
    vacancy_rate: facts.vacancy.rate,
    citations: facts.citations.length
  });

  // ============================================
  // 2. WRITER AGENTS (parallel, mit Retry & Validation)
  // ============================================
  console.log('✍️  Writer Agents starting...');
  const writerContext = {
    payload,
    facts: {
      location: facts.location,
      rent: facts.rent,
      price: facts.price,
      vacancy: facts.vacancy,
      demand: facts.demand,
    }
  };

  const [lage, miete, kauf] = await Promise.all([
    runAgentWithRetry<z.infer<typeof HtmlDeltaSchema>>(
      runner,
      lageagent as unknown as Agent<unknown>,
      writerContext,
      (output) => validateWriterOutput(output, 'lage'),
      'LageAgent',
      1
    ),
    runAgentWithRetry<z.infer<typeof HtmlDeltaSchema>>(
      runner,
      mietagent as unknown as Agent<unknown>,
      writerContext,
      (output) => validateWriterOutput(output, 'miete'),
      'MietAgent',
      1
    ),
    runAgentWithRetry<z.infer<typeof HtmlDeltaSchema>>(
      runner,
      kaufagent as unknown as Agent<unknown>,
      writerContext,
      (output) => validateWriterOutput(output, 'kauf'),
      'KaufAgent',
      1
    ),
  ]);

  console.log('✅ Writer Agents complete');

  // ============================================
  // 3. INVEST AGENT (mit Retry & Validation)
  // ============================================
  console.log('💰 Invest Agent starting...');
  const invest = await runAgentWithRetry<{ html: string }>(
    runner,
    investitionsanalyseagent as unknown as Agent<unknown>,
    {
      payload,
      facts: writerContext.facts,
      lage,
      miete,
      kauf,
    },
    validateInvestOutput,
    'InvestAgent',
    1
  );

  console.log('✅ Invest Agent complete');

  return {
    facts,
    lage,
    miete,
    kauf,
    invest,
  };
}