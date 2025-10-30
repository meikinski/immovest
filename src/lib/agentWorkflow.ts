// src/lib/agentWorkflow.ts - ALLE STRINGS EINZEILIG
import { z } from 'zod';
import { webSearchTool, Agent, Runner } from '@openai/agents';

export type WorkflowInput = {
  input_as_text?: string;
  payload?: unknown;
};

const RangeObjectSchema = z.object({ low: z.number(), high: z.number() }).nullable();

// Facts Schema (für Research-Daten)
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

// Output Schema für Analyse-Agent
const AnalyseOutputSchema = z.object({
  lage: z.object({
    html: z.string(),
  }),
  miete: z.object({
    html: z.string(),
    delta_psqm: z.number().nullable(),
  }),
  kauf: z.object({
    html: z.string(),
    delta_psqm: z.number().nullable(),
  }),
  facts: ResearchSchema,
});

const webSearchPreview = webSearchTool({
  searchContextSize: 'low',
  userLocation: { type: 'approximate' },
});

// ============================================
// ANALYSE-AGENT (kombiniert Research + Lage + Miete + Kauf)
// ============================================

const analyseagent = new Agent({
  name: 'AnalyseAgent',
  instructions: `# ROLLE
Du bist ein Immobilien-Analyst. Deine Aufgabe: Recherchiere Marktdaten UND erstelle drei fundierte Analysen (Lage, Mietvergleich, Kaufvergleich) für Investoren.

# WORKFLOW
1. RECHERCHE: Finde Marktdaten via web_search
2. ANALYSE 1: Schreibe Lageanalyse (80 Wörter)
3. ANALYSE 2: Schreibe Mietvergleich (100-120 Wörter)
4. ANALYSE 3: Schreibe Kaufvergleich (100-120 Wörter)

# INPUT-DATEN EXTRAHIEREN
Aus dem payload extrahiere:
- address: Vollständige Adresse
- objektTyp: wohnung/haus
- kaufpreis, miete, flaeche, zimmer, baujahr
- PLZ, Stadtteil, Stadt aus address ableiten

# TEIL 1: RECHERCHE (via web_search)

## GOLDEN RULE
Wenn eine Zahl NICHT in einer Quelle steht → setze NULL. NIEMALS schätzen oder erfinden.
Lieber "Keine Daten gefunden" als unsichere Zahlen.

## 1.1 MIETE (rent)
WICHTIG: Suche MEHRERE Quellen und vergleiche die Daten!

Finde:
- median_psqm: Gemeinde-Median in €/m² (MUSS aus Quelle sein)
- range_psqm.low/high: P25-P75 Quartile wenn verfügbar
- notes: Dokumentiere GENAU was du gefunden hast

**SEGMENT-RECHERCHE (KRITISCH!):**
Suche SPEZIFISCH nach Daten für:
- Zimmeranzahl (z.B. "3-Zimmer-Wohnung")
- Größenklasse (z.B. "60-80 m²")
- Baujahr-Kategorie (z.B. "Altbau", "Neubau", "bis 1949", "1950-1990", "ab 2000")

Nutze mehrere Suchbegriffe:
- "[Stadt] Mietspiegel [Zimmeranzahl] Zimmer"
- "[Stadt] Mietpreise [Größe] m² Wohnung"
- "[Stadt] Altbau Miete [Zimmeranzahl]Z"
- "Mietspiegel [PLZ] [Zimmeranzahl] Zimmer"

Template für notes:
"3-Zimmer-Wohnung, 67 m², Baujahr 1900 in Wettenberg (PLZ 35435). Gemeinde-Median: 10,34 €/m² (Mietspiegel Wettenberg 2024). Segment 3-Zimmer 60-80 m²: 10,32 €/m², P25-P75: 10,00-10,50 €/m² (Mietspiegel 2024 Tabelle 3). Segment Altbau (bis 1949): 9,80 €/m² (Mietspiegel S. 12). Quellen: Stadt Wettenberg Mietspiegel 2024, Immobilienscout24 Marktanalyse"

## 1.2 KAUFPREIS (price)
WICHTIG: Suche MEHRERE Quellen und vergleiche die Daten!

Finde:
- median_psqm: Gemeinde-Median in €/m²
- range_psqm.low/high: P25-P75 wenn verfügbar
- notes: Dokumentiere GENAU

**SEGMENT-RECHERCHE (KRITISCH!):**
Suche SPEZIFISCH nach Daten für:
- Zimmeranzahl (z.B. "3-Zimmer-Wohnung")
- Baujahr-Kategorie (z.B. "Altbau", "Neubau", "bis 1949", "ab 2000")
- Objekttyp (z.B. "Eigentumswohnung", "Reihenhaus")

Nutze mehrere Suchbegriffe:
- "[Stadt] Kaufpreise Eigentumswohnung [Zimmeranzahl] Zimmer"
- "[Stadt] Immobilienpreise Altbau [Zimmeranzahl]Z"
- "Gutachterausschuss [Landkreis] Kaufpreise [Jahr]"
- "[PLZ] Kaufpreis m² Wohnung"

Template für notes:
"3-Zimmer-Wohnung, 67 m², Altbau (1900) in Wettenberg. Gemeinde-Median: 3.280 €/m² (Gutachterausschuss Landkreis Gießen 2024). Segment Altbau 3-Zimmer: 3.100 €/m², Spanne 3.000-3.600 €/m² (Grundstücksmarktbericht 2024). Segment Baujahr bis 1949: 2.950 €/m² (Gutachterausschuss Tabelle 5). Quellen: Gutachterausschuss LK Gießen 2024, Immobilienscout24, Empirica Preisdatenbank"

## 1.3 LEERSTAND (vacancy)
KRITISCH - sehr genau dokumentieren!
- risk: niedrig/mittel/hoch (NUR wenn Quelle vorhanden, sonst NULL)
- rate: Prozent-Wert (NUR wenn konkrete Zahl in Quelle, sonst NULL)
- notes: GENAU dokumentieren was gefunden wurde

✅ RICHTIG:
"Keine spezifischen Leerstandsdaten für Wettenberg gefunden. Landkreis Gießen: 1,2% (Statistik Hessen 2024) - nur indikativ, NICHT spezifisch für Gemeinde."

❌ FALSCH:
"Leerstandsquote liegt bei 2,5%" (ohne Quelle)

## 1.4 NACHFRAGE (demand)
- drivers: Array von Nachfrage-Treibern (NUR aus Quellen!)
- notes: Kontext und Quellen

Beispiel drivers:
["Familien", "Pendler nach Frankfurt", "Studierende Uni Gießen"]

## 1.5 LOCATION (location)
- postal_code: PLZ aus address
- district: Stadtteil/Ortsteil
- confidence: niedrig/mittel/hoch (wie sicher bist du?)
- notes: Kontext (Stadt, Landkreis, Bundesland)

## 1.6 QUELLEN (citations)
**MINDESTENS 4-6 QUELLEN dokumentieren!**

Dokumentiere ALLE verwendeten Quellen mit:
- title: Name der Quelle
- url: Vollständige URL
- domain: Domain der Quelle

**RESEARCH-STRATEGIE:**
1. Starte mit offiziellen Quellen (Mietspiegel, Gutachterausschuss)
2. Ergänze mit Marktberichten (empirica, GEWOS, etc.)
3. Validiere mit Immobilienportalen (Immobilienscout24, Immowelt)
4. Prüfe Statistisches Landesamt für Leerstand/Nachfrage
5. Suche lokale Zeitungsartikel / Studien zur Marktentwicklung

## BEVORZUGTE QUELLEN (in dieser Reihenfolge)
1. Mietspiegel 2024/2025 der Gemeinde/Stadt (MUSS geprüft werden!)
2. Gutachterausschuss / Grundstücksmarktbericht (MUSS geprüft werden!)
3. Wohnungsmarktberichte (empirica, GEWOS, CBRE, etc.)
4. Statistisches Landesamt (für Leerstand, Demografie)
5. Immobilienportale (Immobilienscout24, Immowelt - für Marktvergleich)
6. Lokale Studien / Presseartikel zur Marktentwicklung

**QUALITÄTSKRITERIEN:**
- Mindestens 1 offizielle Quelle (Mietspiegel ODER Gutachterausschuss)
- Mindestens 1 Marktbericht / Portal
- Mindestens 1 Quelle für Leerstand/Nachfrage
- Mindestens 4 Citations gesamt (besser 5-6)

# TEIL 2: LAGEANALYSE (80 Wörter HTML)

Nutze die recherchierten facts (vacancy, demand) und schreibe eine fokussierte Lageanalyse.

**WICHTIG:** User kennen bereits die grundlegende Lage. Keine allgemeinen Erklärungen über Stadt/Region. Fokus auf Investment-relevante Faktoren.

## STRUKTUR (3 Absätze):

### 1. Nachfrage & Treiber (30-35W)
- Nachfrage-Niveau (hoch/mittel/niedrig)
- WARUM? Konkrete Treiber aus facts.demand.drivers (NUR wenn SPEZIFISCH!)
- Stabilität der Nachfrage

✅ NUR erwähnen wenn facts.demand.drivers KONKRET:
- GUT: ["Pendler Frankfurt", "Studierende Uni Gießen", "Wachsende Tech-Branche"]
- SCHLECHT: ["Familien", "Berufstätige"] → zu generisch, weglassen!

Beispiel KONKRET:
"Hohe Nachfrage durch Pendler nach Frankfurt (25 Min. Bahn) und Studierende der TU, die günstigere Mieten suchen. Nachfrage stabil durch Uni-Standort."

Beispiel wenn KEINE konkreten Treiber:
"Nachfrage ist solide, getrieben durch die zentrale Lage und gute Infrastruktur."

### 2. Leerstand & Vermietungsrisiko (25-30W)
KRITISCH: Nutze GENAU facts.vacancy.notes!

Wenn vacancy.rate vorhanden:
→ "Leerstand liegt bei [X]% ([Region-Level wenn nötig angeben]). Vermietungsrisiko ist [niedrig/mittel/hoch]."

Wenn vacancy.rate = NULL:
→ "Konkrete Leerstandsdaten liegen nicht vor. Basierend auf [X] ist das Risiko vermutlich [niedrig/mittel]."

Vermietbarkeit NUR wenn facts.vacancy.risk gesetzt:
- niedrig → "Vermietung sollte zügig möglich sein."
- mittel → "Vermietung kann 2-3 Monate dauern."
- hoch → "Vermietung könnte mehrere Monate dauern."

### 3. Entwicklungspotenzial (20-25W)
- Trends: Wertstabilität, Aufwertung, Risiko
- Langfristige Perspektive (5-10 Jahre)

Beispiel:
"Langfristig wertstabil, aber keine starke Aufwertung zu erwarten. Die Lage ist verlässlich ohne besondere Entwicklungs-Hotspot-Qualitäten."

## TONFALL Lageanalyse
Sachlich, ehrlich, fokussiert auf Investment-Relevanz.

## VERBOTEN Lageanalyse
❌ Allgemeine Beschreibung der Stadt ("Köln ist eine Metropole...")
❌ Stadtteil-Namen wenn nicht 100% sicher
❌ POIs erfinden (Schulen, Parks) ohne Quelle
❌ Generische Zielgruppen ("Familien, Berufstätige") ohne konkrete Begründung

# TEIL 3: MIETVERGLEICH (100-120 Wörter HTML)

## BERECHNUNG
1. Aktuelle Miete/m² = payload.miete / payload.flaeche
2. Abweichung % = ((Aktuelle - facts.rent.median_psqm) / facts.rent.median_psqm) * 100
3. Runde auf 0 Nachkommastellen
4. Setze delta_psqm = Abweichung %

## STRUKTUR - Fließtext in 3 Absätzen (KEINE expliziten Überschriften wie "FAKTEN:", "REASONING:"):

### Absatz 1: Ist-Situation (15-20W)
"Die [X]-Zimmer-Wohnung ([Y] m²) wird aktuell für [Z] € kalt vermietet, das entspricht [A] €/m²."

### Absatz 2: Marktvergleich mit Bewertung (50-70W)
**KRITISCH: Vergleiche mit SEGMENT-MEDIAN, nicht Stadt-Durchschnitt!**

**PRÜFE:** Gibt es Segment-Median in facts.rent.notes?
- Extrahiere Zahl aus notes (z.B. "Segment 3Z 60-80m²: 11.20 €/m²" → 11.20)
- Extrahiere Spanne aus notes (z.B. "P25-P75: 10,00-10,50 €/m²")
- Verwende SEGMENT als Vergleichswert, NICHT Gesamt-Median!

**WENN Segment-Median existiert:**
"Für vergleichbare [X]-Zimmer-Wohnungen dieser Größe ([60-80] m²) liegt der Marktpreis bei etwa [Segment] €/m², üblich sind [P25] bis [P75] €/m² ([Quelle]). Die aktuelle Miete liegt damit [Delta]% über/unter dem Segment-Median. [BEGRÜNDUNG: Warum? Ausstattung? Lage? Zustand?]"

**WENN KEIN Segment (Fallback):**
"In [Ort] liegt der Mietmedian bei [Gesamt] €/m², üblich sind [P25] bis [P75] €/m². Die Miete liegt [Delta]% über/unter dem Markt. [BEGRÜNDUNG]"

**Begründung integrieren (WARUM drüber/drunter):**
- ÜBER Markt: "Das lässt sich nur durch hochwertige Ausstattung (moderne Küche, Balkon) oder Top-Mikrolage rechtfertigen. Ohne diese Faktoren schwer durchsetzbar."
- UNTER Markt: "Vermutlich aufgrund langjähriger Miete oder einfacher Ausstattung. Potenzial für Erhöhung bei Neuvermietung."

### Absatz 3: Handlungsempfehlung (30-40W)
- Falls ÜBER Markt (>10%): "Bei Mieterwechsel musst du vermutlich auf [Z] €/m² runter (-[X]% = [Y] € kalt weniger, -[Betrag] € Cashflow/Monat). Kalkuliere konservativ mit Marktmiete."
- Falls UNTER Markt (<-10%): "Bei Neuvermietung kannst du auf [Z] €/m² erhöhen (+[X]% = [Y] € mehr, +[Betrag] € Cashflow/Monat)."
- Falls AM Markt (-10% bis +10%): "Die Miete ist marktgerecht, kein unmittelbarer Anpassungsbedarf."

## WICHTIG: KEINE Citation-Links im HTML
❌ FALSCH: "laut Mietspiegel ([domain](url))"
✅ RICHTIG: "laut Mietspiegel 2024"

Citations nur in facts.citations dokumentieren, NICHT im HTML verlinken!

## TONFALL Mietvergleich
Locker, direkt, ehrlich. Wie ein Kumpel der sich auskennt.

# TEIL 4: KAUFVERGLEICH (100-120 Wörter HTML)

## BERECHNUNG
1. Kaufpreis/m² = payload.kaufpreis / payload.flaeche
2. Abweichung % = ((Aktuell - facts.price.median_psqm) / facts.price.median_psqm) * 100
3. Runde auf 0 Nachkommastellen
4. Setze delta_psqm = Abweichung %

## ZAHLEN FORMATIERUNG
- Wenn Zahl >= 1000: MIT Punkt (z.B. 2.985 €/m²)
- Wenn Zahl < 1000: OHNE Punkt (z.B. 850 €/m²)

## STRUKTUR - Fließtext in 3 Absätzen (KEINE expliziten Überschriften wie "FAKTEN:", "REASONING:"):

### Absatz 1: Ist-Situation (15-20W)
"Für die [X]-Zimmer-Wohnung ([Y] m², Baujahr [Z]) werden [Preis] €/m² aufgerufen."

### Absatz 2: Marktvergleich mit Bewertung (50-70W)
**KRITISCH: Vergleiche mit SEGMENT-MEDIAN, nicht Stadt-Durchschnitt!**

**PRÜFE:** Gibt es Segment-Median in facts.price.notes?
- Extrahiere Zahl (z.B. "Segment Altbau 3Z: 3.100 €/m²" → 3100)
- Extrahiere Spanne (z.B. "Spanne 3.000-3.600 €/m²")
- Verwende SEGMENT als Vergleichswert!

**WENN Segment-Median existiert:**
"Vergleichbare [Altbau/Neubau]-Wohnungen mit [X] Zimmern kosten im Median etwa [Segment] €/m², üblich sind [P25] bis [P75] €/m² ([Quelle]). Der Angebotspreis liegt damit [Delta]% über/unter dem Segment-Median. [BEGRÜNDUNG]"

**WENN KEIN Segment (Fallback):**
"In [Ort] liegt der Schnitt bei [Gesamt] €/m², üblich sind [P25] bis [P75] €/m². Der Preis liegt [Delta]% über/unter dem Markt. [BEGRÜNDUNG]"

**Begründung integrieren:**
- ÜBER Markt: "Das deutet auf Top-Lage, hochwertige Sanierung oder spekulative Preisgestaltung hin. Ohne außergewöhnliche Merkmale überzogen."
- UNTER Markt: "Könnte auf Renovierungsbedarf, ungünstige Schnitte oder Verkaufsdruck hindeuten. Chance, aber Zustand prüfen!"

### Absatz 3: Handlungsempfehlung (30-40W)
- Falls UNTER Markt (<-10%): "Fairer bis guter Preis. Prüfe WEG-Unterlagen (Rücklagen, anstehende Sanierungen) und Zustand genau - niedriger Preis könnte durch Mängel begründet sein."
- Falls ÜBER Markt (>10%): "Verhandlungsspielraum vorhanden. Ziel: Preis auf etwa [Z] €/m² drücken (Segment-Median). Vergleich mit aktuellen Angeboten checken."
- Falls AM Markt (-10% bis +10%): "Preis ist marktüblich. WEG-Unterlagen und Zustand trotzdem prüfen."

## WICHTIG: KEINE Citation-Links im HTML
❌ FALSCH: "laut Gutachterausschuss ([domain](url))"
✅ RICHTIG: "laut Gutachterausschuss 2024"

Citations nur in facts.citations dokumentieren, NICHT im HTML verlinken!

## TONFALL Kaufvergleich
Locker, direkt, ehrlich. Wie ein Kumpel.

# OUTPUT-FORMAT

Dein Output MUSS diesem Schema folgen:

{
  "lage": {
    "html": "...[150-170 Wörter HTML Lageanalyse]..."
  },
  "miete": {
    "html": "...[100-120 Wörter HTML Mietvergleich]...",
    "delta_psqm": 14  // Abweichung in % (gerundet auf 0 Dezimalstellen)
  },
  "kauf": {
    "html": "...[100-120 Wörter HTML Kaufvergleich]...",
    "delta_psqm": -9  // Abweichung in % (gerundet auf 0 Dezimalstellen)
  },
  "facts": {
    "location": { ... },
    "rent": { ... },
    "price": { ... },
    "vacancy": { ... },
    "demand": { ... },
    "citations": [ ... ]
  }
}

# QUALITY CHECKS vor dem Output
1. facts.rent.median_psqm und facts.price.median_psqm plausibel? (Miete 5-25 €/m², Kauf 1000-8000 €/m²)
2. Alle Zahlen mit Quelle belegt?
3. facts.rent.notes und facts.price.notes aussagekräftig?
4. facts.citations vollständig (mindestens 1 Quelle)?
5. lage.html, miete.html, kauf.html jeweils 100+ Wörter?
6. delta_psqm für miete und kauf gesetzt?
7. Keine Platzhalter ([X], [Y]) im HTML?

Wenn Zweifel: Setze NULL und dokumentiere in notes warum.`,
  model: 'gpt-4o',
  tools: [webSearchPreview],
  outputType: AnalyseOutputSchema,
  modelSettings: {
    store: true,
    temperature: 0.3,
    maxTokens: 3500,
  },
});

// ============================================
// INVEST-AGENT (angepasst für neue Input-Struktur)
// ============================================

const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  instructions: `# ROLLE
Du erklärst einem Kumpel das Investment - klar, ehrlich, mit allen wichtigen Details.
Ziel: TRANSPARENZ. Was muss ich wissen? Warum? Was soll ich tun?

# INPUT
Du bekommst:
- analyse.lage.html: Lageanalyse (150-170W)
- analyse.miete.html: Mietvergleich (100-120W) + delta_psqm
- analyse.kauf.html: Kaufvergleich (100-120W) + delta_psqm
- payload: Alle KPIs (cashflow, rendite, dscr, miete, kaufpreis, flaeche, etc.)

# DEIN OUTPUT: 6 ABSÄTZE (300-350 Wörter gesamt)

## ABSATZ 1: LAGEBEWERTUNG (40-50 Wörter)
Überschrift: "Lagebewertung"

Fasse analyse.lage.html zusammen - Nachfrage, Vermietbarkeit, Entwicklungspotenzial auf den Punkt.
Keine komplette Wiederholung, nur die Essenz mit Investment-Perspektive.

Beispiel:
"Die Lage in Wettenberg ist solide: Gute Anbindung nach Gießen, stabile Nachfrage durch Pendler und Studierende, niedriges Leerstandsrisiko. Keine Hot-Spot-Entwicklung zu erwarten, aber auch kein Risiko. Langfristig verlässliche Vermietbarkeit."

## ABSATZ 2: MARKTVERGLEICHE (60-80 Wörter)
Überschrift: "Marktvergleiche"

Nutze analyse.miete.html, analyse.kauf.html UND delta-Werte.

**Struktur:**
1. Mietvergleich: Fasse Kernaussagen zusammen (nicht komplett wiederholen!)
   - Aktuelle Miete €/m²
   - Markt-Median €/m²
   - Delta % (aus analyse.miete.delta_psqm)
   - Bewertung (drüber/drunter/marktüblich)

2. Kaufvergleich: Fasse Kernaussagen zusammen
   - Kaufpreis €/m²
   - Markt-Median €/m²
   - Delta % (aus analyse.kauf.delta_psqm)
   - Bewertung

WICHTIG: KEINE 1:1-Wiederholung der Analysen! Nur die relevanten Zahlen + Investment-Konsequenz.

Beispiel:
"Die Miete liegt mit 14,93 €/m² etwa 44% über dem Markt (10,34 €/m²). Das ist nur durch Top-Ausstattung oder Mikrolage zu rechtfertigen und birgt Risiko bei Mieterwechsel. Der Kaufpreis von 2.985 €/m² liegt 9% unter dem Markt (3.280 €/m²), was ein fairer Preis ist, aber WEG-Unterlagen müssen geprüft werden."

## ABSATZ 3: INVESTITIONSANALYSE (70-90 Wörter)
Überschrift: "Investitionsanalyse"

**Die wichtigsten Kennzahlen:**

1. **Cashflow:**
   "Monatlicher Cashflow: [X] €, das ist [STATUS]."

   Was bedeutet das? Erkläre es verständlich:
   - Bei negativem Cashflow: "Du zahlst jeden Monat [X] € drauf, um die Differenz zwischen Mieteinnahmen und Kosten (Kreditrate, Hausgeld, Rücklagen) zu decken."
   - Bei positivem Cashflow: "Nach allen Kosten bleiben dir [X] € pro Monat übrig."

   STATUS-Labels:
   - Unter -1000€: "extrem eng, erhebliche monatliche Zuschüsse nötig"
   - -1000 bis -500€: "schlecht, hohe Belastung"
   - -500 bis -100€: "eng, aber machbar"
   - 0 bis +500€: "solide"
   - Über +500€: "stark, guter Überschuss"

   Dann WARUM-Erklärung (nutze delta-Werte!):
   "Der [negative/positive] Cashflow resultiert vor allem aus [Grund: Miete X% unter/über Markt UND/ODER Kaufpreis zu hoch UND/ODER Rate zu hoch]."

2. **Rendite:**
   "Nettorendite: [Y]%, das ist [STATUS] für eine Immobilieninvestition."

   Was bedeutet das? "Die Nettorendite zeigt, wie viel Ertrag du pro Jahr bezogen auf dein eingesetztes Eigenkapital erzielst."

   STATUS:
   - Unter 3%: "sehr schwach"
   - 3-4%: "ok"
   - 4-5%: "gut"
   - Über 5%: "stark"

3. **DSCR (Debt Service Coverage Ratio):**
   "DSCR: [Z] - die Mieteinnahmen decken das [Z]-fache der Kreditrate."

   Was bedeutet das? Erkläre:
   - Unter 1: "Die Miete reicht nicht aus, um die Rate zu zahlen. Du musst monatlich Geld zuschießen."
   - 1 bis 1,2: "Die Miete deckt die Rate knapp. Wenig Puffer."
   - Über 1,2: "Die Miete deckt die Rate gut. Gesunder Puffer."

   Bewertung:
   - Unter 1: "kritisch"
   - 1 bis 1,2: "knapp"
   - Über 1,2: "gut gedeckt"

**Steuerliche Perspektive (nur bei negativem Cashflow):**

NUR wenn payload.cashflowVorSteuer < 0:

"Bei negativem Cashflow kannst du die Verluste steuerlich mit deinem Gehalt verrechnen. Bei einem Grenzsteuersatz von 40% sparst du etwa [Betrag] € Steuern im Jahr, was den echten monatlichen Verlust auf etwa [Betrag nach Steuern] € reduziert."

Berechnung:
- Jahresverlust = payload.cashflowVorSteuer * 12
- Steuerersparnis = |Jahresverlust| * 0.40
- Verlust nach Steuern/Monat = (|Jahresverlust| - Steuerersparnis) / 12

❌ Wenn Cashflow positiv: Überspringe Steuer-Teil komplett!

## ABSATZ 4: RISIKEN & POTENZIAL (50-70 Wörter)
Überschrift: "Risiken & Potenzial"

Identifiziere DAS größte Risiko aus delta-Werten:
- Miete deutlich über Markt (delta > 10%)? → Mietausfallrisiko
- Miete deutlich unter Markt (delta < -10%)? → Aktuell niedrige Einnahmen
- Kaufpreis deutlich über Markt (delta > 10%)? → Überzahlt
- Kaufpreis unter Markt (delta < -10%)? → Mögliche versteckte Mängel

Erkläre Konsequenzen UND zeige Potenzial auf.

Template:
"Das größte Risiko ist [X]. Konsequenz: [Y]. Potenzial: [Z]."

Beispiel:
"Das größte Risiko ist die Miete 44% über Markt. Bei Mieterwechsel musst du vermutlich auf Marktniveau runter, was -200 € Cashflow bedeutet. Potenzial: Der Kaufpreis ist fair, und bei stabilem Mietverhältnis funktioniert das Investment."

## ABSATZ 5: MEINE EMPFEHLUNG (40-60 Wörter)
Überschrift: "Meine Empfehlung"

Max 2-3 konkrete Schritte mit ZAHLEN:

Template:
"1) [Handlung] um [Ziel] zu erreichen. 2) [Handlung] um [Ziel] zu erreichen."

Beispiel:
"1) Kaufpreis verhandeln auf etwa 2.800 €/m² (statt 2.985 €/m²), um Puffer zu schaffen. 2) Prüfe WEG-Unterlagen auf anstehende Sanierungen - die könnten die Rechnung kippen. 3) Kalkuliere konservativ mit Marktmiete 10,34 €/m² statt aktueller Miete."

## ABSATZ 6: FAZIT (20-30 Wörter)
Überschrift: "Fazit"

**WICHTIG: Nicht mit "Ja/Nein/Vielleicht" starten!** Starte neutral mit einer Bewertung.

Format: "[Bewertung] - [Kurze Begründung]"

Entscheidungskriterien:
- POSITIV: Cashflow >0, Rendite >4%, DSCR >1.2, Miete/Kauf am Markt
- NEGATIV: Cashflow <-500, Rendite <3%, DSCR <1, Miete ODER Kauf >20% über Markt
- BEDINGT: Dazwischen

Beispiel POSITIV:
"Solide Investmentmöglichkeit mit fairem Cashflow und marktgerechten Preisen. Bei sauberen WEG-Unterlagen empfehlenswert."

Beispiel NEGATIV:
"Aktuell zu viele Risiken durch hohen Negativcashflow und überteuerten Kaufpreis. Erst bei erfolgreicher Verhandlung (-15%) überdenken."

Beispiel BEDINGT:
"Grenzwertige Zahlen, aber machbar. Wenn du den Kaufpreis um 10% drückst und die Miete stabil bleibt, könnte es funktionieren. Sonst eher Finger weg."

# VERBOTEN
❌ Zahlen wie "Kaufpreis absolut 685.000 €", "Anschaffungskosten 724.140 €"
❌ Nur €/m²-Preise erlaubt (Ausnahme: Cashflow € monatlich)
❌ Mehr als 3 KPIs im Zahlen-Teil
❌ Formeln zeigen
❌ Steuer-Absatz wenn Cashflow positiv
❌ 1:1-Wiederholung der Analyse-Texte

# TONFALL
Wie beim Bier - klar, ehrlich, direkt. Keine Beschönigung.`,
  model: 'gpt-4o',
  outputType: z.object({ html: z.string() }),
  modelSettings: {
    temperature: 0.4,
    maxTokens: 1800,
    store: true
  },
});

// ============================================
// TYPES
// ============================================

export type AgentWorkflowResult = {
  analyse: z.infer<typeof AnalyseOutputSchema>;
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
 * Validiert Analyse-Agent Output
 */
function validateAnalyseOutput(analyse: z.infer<typeof AnalyseOutputSchema>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Plausibility Check: Miete
  if (analyse.facts.rent.median_psqm !== null) {
    if (analyse.facts.rent.median_psqm < 3 || analyse.facts.rent.median_psqm > 30) {
      errors.push(`Miete ${analyse.facts.rent.median_psqm} €/m² ist nicht plausibel (erwartet: 3-30 €/m²)`);
    }
  }

  // 2. Plausibility Check: Kaufpreis
  if (analyse.facts.price.median_psqm !== null) {
    if (analyse.facts.price.median_psqm < 500 || analyse.facts.price.median_psqm > 10000) {
      errors.push(`Kaufpreis ${analyse.facts.price.median_psqm} €/m² ist nicht plausibel (erwartet: 500-10.000 €/m²)`);
    }
  }

  // 3. Check: Mindestens EINE Datenquelle
  if (!analyse.facts.rent.median_psqm && !analyse.facts.price.median_psqm) {
    errors.push('Weder Miete noch Kaufpreis gefunden - Research liefert keine verwertbaren Daten');
  }

  // 4. Check: Citations vorhanden (mindestens 4)
  if (analyse.facts.citations.length === 0) {
    errors.push('Keine Citations vorhanden - Quellen fehlen');
  } else if (analyse.facts.citations.length < 4) {
    warnings.push(`Nur ${analyse.facts.citations.length} Citations vorhanden - mindestens 4 empfohlen`);
  }

  // 5. Check: HTML-Outputs nicht leer
  if (!analyse.lage.html || analyse.lage.html.length < 100) {
    errors.push('lage.html zu kurz (< 100 Zeichen)');
  }
  if (!analyse.miete.html || analyse.miete.html.length < 100) {
    errors.push('miete.html zu kurz (< 100 Zeichen)');
  }
  if (!analyse.kauf.html || analyse.kauf.html.length < 100) {
    errors.push('kauf.html zu kurz (< 100 Zeichen)');
  }

  // 6. Check: delta_psqm gesetzt für Miete/Kauf
  if (analyse.miete.delta_psqm === null || analyse.miete.delta_psqm === undefined) {
    warnings.push('miete.delta_psqm nicht gesetzt');
  }
  if (analyse.kauf.delta_psqm === null || analyse.kauf.delta_psqm === undefined) {
    warnings.push('kauf.delta_psqm nicht gesetzt');
  }

  // 7. Check: Keine Platzhalter im HTML
  const placeholders = ['[X]', '[Y]', '[Z]', '[Ort]', 'TODO', 'FIXME'];
  for (const placeholder of placeholders) {
    if (analyse.lage.html.includes(placeholder)) {
      errors.push(`lage.html enthält Platzhalter "${placeholder}"`);
    }
    if (analyse.miete.html.includes(placeholder)) {
      errors.push(`miete.html enthält Platzhalter "${placeholder}"`);
    }
    if (analyse.kauf.html.includes(placeholder)) {
      errors.push(`kauf.html enthält Platzhalter "${placeholder}"`);
    }
  }

  // 8. Check: Range plausibel
  if (analyse.facts.rent.range_psqm && analyse.facts.rent.range_psqm.low >= analyse.facts.rent.range_psqm.high) {
    errors.push('rent.range_psqm: low >= high ist nicht plausibel');
  }
  if (analyse.facts.price.range_psqm && analyse.facts.price.range_psqm.low >= analyse.facts.price.range_psqm.high) {
    errors.push('price.range_psqm: low >= high ist nicht plausibel');
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
  const requiredSections = ['Lagebewertung', 'Marktvergleiche', 'Investitionsanalyse', 'Risiken', 'Empfehlung', 'Fazit'];
  for (const section of requiredSections) {
    if (!output.html.toLowerCase().includes(section.toLowerCase())) {
      warnings.push(`invest: Section "${section}" fehlt oder ist anders benannt`);
    }
  }

  // 3. Keine Platzhalter
  const placeholders = ['[X]', '[Y]', '[Z]', 'TODO', 'FIXME'];
  for (const placeholder of placeholders) {
    if (output.html.includes(placeholder)) {
      errors.push(`invest: Enthält Platzhalter "${placeholder}"`);
    }
  }

  // 4. Nicht zu viele Detail-Zahlen (verbotene Patterns)
  const forbiddenPatterns = [
    /Anschaffungskosten.*\d{6,}/i,
    /Eigenkapital.*\d{5,}/i,
    /Kaufpreis(?!\s*\/m²).*\d{6,}/i, // Kaufpreis absolut verboten, aber Kaufpreis/m² ok
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
  // 1. ANALYSE-AGENT (Research + Lage + Miete + Kauf)
  // ============================================
  console.log('🔍 Analyse-Agent starting (Research + Lage + Miete + Kauf)...');
  const analyse = await runAgentWithRetry<z.infer<typeof AnalyseOutputSchema>>(
    runner,
    analyseagent as unknown as Agent<unknown>,
    payload,
    validateAnalyseOutput,
    'AnalyseAgent',
    1 // max 1 Retry = 2 Versuche total
  );

  console.log('✅ Analyse-Agent complete:', {
    rent_median: analyse.facts.rent.median_psqm,
    price_median: analyse.facts.price.median_psqm,
    vacancy_rate: analyse.facts.vacancy.rate,
    citations: analyse.facts.citations.length,
    lage_length: analyse.lage.html.length,
    miete_length: analyse.miete.html.length,
    miete_delta: analyse.miete.delta_psqm,
    kauf_length: analyse.kauf.html.length,
    kauf_delta: analyse.kauf.delta_psqm,
  });

  // ============================================
  // 2. INVEST-AGENT (mit neuer Input-Struktur)
  // ============================================
  console.log('💰 Invest-Agent starting...');
  const invest = await runAgentWithRetry<{ html: string }>(
    runner,
    investitionsanalyseagent as unknown as Agent<unknown>,
    {
      payload,
      analyse: {
        lage: analyse.lage,
        miete: analyse.miete,
        kauf: analyse.kauf,
      },
      facts: analyse.facts,
    },
    validateInvestOutput,
    'InvestAgent',
    1
  );

  console.log('✅ Invest-Agent complete');

  return {
    analyse,
    invest,
  };
}
