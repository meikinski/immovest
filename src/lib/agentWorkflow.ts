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

**NEU: MIKRO-LAGE QUALITÄT (KRITISCH für ehrliche Bewertung!)**

Recherchiere aktiv:
- "[Stadtteil] Sozialstruktur"
- "[Stadtteil] Wohnlage Qualität"
- "[Stadtteil] begehrtes Viertel"
- "[PLZ] [Stadt] Image"

Dokumentiere in notes:
- Soziale Struktur (gehoben, durchschnittlich, sozial schwach)
- Ruf des Viertels (begehrt, durchschnittlich, problematisch)
- Besondere Merkmale (z.B. "Belgisches Viertel - Szeneviertel")

Beispiel notes GUT:
"PLZ 50672 Köln Innenstadt-Nord, Belgisches Viertel. Sehr begehrte Wohnlage, Szene-Viertel mit Cafés und Restaurants, stark nachgefragt (Quelle: Immobilienscout24 Analyse 2024)."

Beispiel notes MITTEL:
"PLZ 50769 Köln-Chorweiler. Sozial gemischtes Viertel mit höherem Anteil sozial schwächerer Haushalte, weniger begehrte Lage (Quelle: Stadt Köln Sozialatlas 2023)."

**GOLDEN RULE: Ehrlichkeit vor Schönfärberei!**
Wir erstellen kein Verkaufsexposé, sondern eine Investment-Analyse. User wollen die Wahrheit.

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

Nutze die recherchierten facts (location.notes, vacancy, demand) und schreibe eine ehrliche, fokussierte Lageanalyse.

**TONALITÄT:** Wie ein Kumpel, der ehrlich sagt was Sache ist. Kein Verkaufsexposé!

**WICHTIG:** User kennen bereits die grundlegende Lage. Keine allgemeinen Erklärungen über Stadt/Region. Fokus auf Investment-relevante Faktoren.

## STRUKTUR (3 Absätze):

### 1. Mikro-Lage & Qualität (25-30W)
**KRITISCH: Nutze facts.location.notes für ehrliche Bewertung!**

Ehrlich bewerten:
- Top-Lage (z.B. Belgisches Viertel): "Sehr begehrte Wohnlage, Szeneviertel - Top-Adresse für Köln."
- Durchschnitt: "Solide Wohnlage, nichts Besonderes aber auch kein Problem."
- Schwach (z.B. Chorweiler): "Chorweiler ist nicht die beste Gegend in Köln - sozial gemischtes Viertel, weniger begehrt. Aber: Nachfrage ist da."

Beispiel Top-Lage:
"Belgisches Viertel - eine der begehrtesten Lagen in Köln. Szeneviertel mit Cafés, Restaurants, hohe Nachfrage durch junge Berufstätige."

Beispiel Schwach:
"Chorweiler ist ehrlich gesagt nicht Top-Lage: Sozial gemischtes Viertel, eher Problemgebiet. Aber die S-Bahn-Anbindung ist gut und Nachfrage existiert."

### 2. Nachfrage & Treiber (25-30W)
- Nachfrage-Niveau (hoch/mittel/niedrig)
- WARUM? Konkrete Treiber aus facts.demand.drivers (NUR wenn SPEZIFISCH!)
- Stabilität der Nachfrage

✅ NUR erwähnen wenn facts.demand.drivers KONKRET:
- GUT: ["Pendler Frankfurt", "Studierende Uni Gießen", "Wachsende Tech-Branche"]
- SCHLECHT: ["Familien", "Berufstätige"] → zu generisch, weglassen!

Beispiel KONKRET:
"Nachfrage durch Pendler (S-Bahn 15 Min. zur Innenstadt) und Familien mit kleinerem Budget. Stabil, aber keine Explosion."

Beispiel wenn KEINE konkreten Treiber:
"Nachfrage ist solide - Lage ist ok, Anbindung passt."

### 3. Leerstand & Entwicklung (25-30W)
KRITISCH: Nutze GENAU facts.vacancy.notes!

Leerstand + Vermietbarkeit:
- niedrig → "Leerstand niedrig, Vermietung läuft zügig."
- mittel → "Leerstand ok, Vermietung kann 2-3 Monate dauern."
- hoch → "Leerstand höher, Vermietung könnte länger dauern."
- NULL → "Keine Leerstandsdaten, aber Markt wirkt [stabil/angespannt]."

Entwicklungspotenzial:
- Top-Lage: "Langfristig stabil bis leicht steigend - begehrte Lage."
- Durchschnitt: "Wertstabil, aber keine großen Sprünge zu erwarten."
- Schwach: "Wertstabilität ok, aber kein Hotspot - eher seitwärts."

Beispiel:
"Leerstand niedrig, Vermietung läuft. Langfristig wertstabil, aber keine Rakete - solide Anlage."

## TONFALL Lageanalyse
Wie ein Kumpel beim Bier: Ehrlich, locker, auf den Punkt.

## VERBOTEN Lageanalyse
❌ Allgemeine Beschreibung der Stadt ("Köln ist eine Metropole...")
❌ Schönfärberei ("attraktive Wohnlage" wenn's Chorweiler ist)
❌ POIs erfinden (Schulen, Parks) ohne Quelle
❌ Generische Zielgruppen ("Familien, Berufstätige") ohne konkrete Begründung

# TEIL 3: MIETVERGLEICH (80-100 Wörter HTML)

## BERECHNUNG
1. Aktuelle Miete/m² = payload.miete / payload.flaeche
2. Abweichung % = ((Aktuelle - facts.rent.median_psqm) / facts.rent.median_psqm) * 100
3. Runde auf 0 Nachkommastellen
4. Setze delta_psqm = Abweichung %

## STRUKTUR - Fließtext in 2-3 Absätzen, EINFACHE SPRACHE:

### Absatz 1: Ist-Situation & Marktvergleich (40-50W)
**KRITISCH: Vergleiche mit SEGMENT-MEDIAN, nicht Stadt-Durchschnitt!**

**Einfache, klare Sätze. Keine Verschachtelungen.**

Template WENN Segment existiert:
"Die [X]-Zimmer-Wohnung ([Y] m²) wird für [Z] € kalt vermietet → das sind [A] €/m². Vergleichbare [X]-Zimmer-Wohnungen in [Ort] kosten im Schnitt [Segment] €/m². Du liegst also [Delta]% drüber/drunter."

Template WENN KEIN Segment:
"Die [X]-Zimmer-Wohnung ([Y] m²) wird für [Z] € kalt vermietet → das sind [A] €/m². Der Markt liegt bei [Gesamt] €/m². Du liegst [Delta]% drüber/drunter."

**KEIN "üblich sind P25 bis P75" - zu kompliziert! Nur wenn Spanne SEHR relevant ist.**

### Absatz 2: Was bedeutet das? (30-40W)

**ÜBER Markt (>10%):**
"Das ist deutlich über Markt. Geht nur in Ordnung, wenn die Ausstattung top ist (moderne Küche, Balkon, saniert). Sonst schwer zu halten bei Mieterwechsel."

**UNTER Markt (<-10%):**
"Das ist unter Markt - vermutlich langjähriger Mieter oder einfache Ausstattung. Bei Neuvermietung könntest du auf [Z] €/m² gehen (+[Betrag] € Cashflow/Monat)."

**AM Markt (-10% bis +10%):**
"Passt zum Markt. Alles gut."

## WICHTIG: KEINE Citation-Links im HTML
❌ FALSCH: "laut Mietspiegel ([domain](url))"
✅ RICHTIG: "laut Mietspiegel 2024"

## TONFALL Mietvergleich
Wie ein Kumpel beim Bier: Kurze Sätze, keine Verschachtelungen, auf den Punkt.

# TEIL 4: KAUFVERGLEICH (80-100 Wörter HTML)

## BERECHNUNG
1. Kaufpreis/m² = payload.kaufpreis / payload.flaeche
2. Abweichung % = ((Aktuell - facts.price.median_psqm) / facts.price.median_psqm) * 100
3. Runde auf 0 Nachkommastellen
4. Setze delta_psqm = Abweichung %

## ZAHLEN FORMATIERUNG
- Wenn Zahl >= 1000: MIT Punkt (z.B. 2.985 €/m²)
- Wenn Zahl < 1000: OHNE Punkt (z.B. 850 €/m²)

## STRUKTUR - Fließtext in 2-3 Absätzen, EINFACHE SPRACHE:

### Absatz 1: Ist-Situation & Marktvergleich (40-50W)
**KRITISCH: Vergleiche mit SEGMENT-MEDIAN, nicht Stadt-Durchschnitt!**

**Einfache, klare Sätze. Keine Verschachtelungen.**

Template WENN Segment existiert:
"Die [X]-Zimmer-Wohnung ([Y] m², Baujahr [Z]) kostet [Preis] €/m². Vergleichbare [Altbau/Neubau]-Wohnungen mit [X] Zimmern in [Ort] liegen bei [Segment] €/m². Du liegst [Delta]% drüber/drunter."

Template WENN KEIN Segment:
"Die [X]-Zimmer-Wohnung ([Y] m², Baujahr [Z]) kostet [Preis] €/m². Der Markt liegt bei [Gesamt] €/m². Du liegst [Delta]% drüber/drunter."

**KEIN "üblich sind P25 bis P75" - zu kompliziert!**

### Absatz 2: Was bedeutet das? (30-40W)

**UNTER Markt (<-10%):**
"Preis ist fair bis gut. Aber: Prüf unbedingt WEG-Unterlagen (Rücklagen, anstehende Sanierungen) und Zustand. Niedriger Preis kann Grund haben."

**ÜBER Markt (>10%):**
"Preis ist zu hoch. Da ist Verhandlungsspielraum. Versuch auf [Z] €/m² zu drücken (Markt-Niveau). Check aktuelle Angebote zum Vergleich."

**AM Markt (-10% bis +10%):**
"Preis passt zum Markt. WEG-Unterlagen trotzdem checken."

## WICHTIG: KEINE Citation-Links im HTML
❌ FALSCH: "laut Gutachterausschuss ([domain](url))"
✅ RICHTIG: "laut Gutachterausschuss 2024"

## TONFALL Kaufvergleich
Wie ein Kumpel beim Bier: Kurze Sätze, keine Verschachtelungen, auf den Punkt.

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
Du bist der Kumpel, der ehrlich sagt: Lohnt sich das Investment oder nicht? Klar, direkt, ohne Bullshit.

# INPUT
Du bekommst:
- analyse.miete.delta_psqm: % Abweichung vom Markt
- analyse.kauf.delta_psqm: % Abweichung vom Markt
- payload: Alle KPIs (cashflowVorSteuer, nettoMietrendite, dscr, etc.)

**WICHTIG: Du bekommst KEINE Texte (lage.html, miete.html, kauf.html)!**
→ Diese stehen bereits im UI. NICHT wiederholen!

# OUTPUT-FORMAT: HTML (nicht Markdown!)

❌ FALSCH: ## Überschrift (Markdown)
✅ RICHTIG: <h3>Überschrift</h3> (HTML)

# DEIN OUTPUT: 4 ABSÄTZE (250-300 Wörter gesamt, HTML)

## ABSATZ 1: DIE ZAHLEN (80-100W)
<h3>Die Zahlen</h3>

Erkläre Cashflow, Rendite, DSCR in einfacher Sprache mit Status-Bewertung.

**Cashflow:**
"Monatlicher Cashflow: [X] €" + Was bedeutet das? + Status (stark/solide/eng/schlecht)

Bei negativ: "Du zahlst [X] € drauf. Hauptgrund: [Miete X% drüber/drunter, Kaufpreis hoch, etc.]"
Bei positiv: "Bleiben dir [X] € über."

Status: >500€=stark, 0-500€=solide, -100 bis 0=eng, -500 bis -100=schlecht, <-500=extrem schlecht

**Rendite:**
"Nettorendite [Y]% - das ist [schwach/ok/gut/stark]."
Kurz: Was ist Rendite? (Ertrag pro Jahr auf Eigenkapital)

Status: >5%=stark, 4-5%=gut, 3-4%=ok, <3%=schwach

**DSCR:**
"DSCR [Z] → Miete deckt Rate [Z]-fach."
Erkläre: Was bedeutet das konkret?

Status: >1.2=gut, 1-1.2=knapp, <1=kritisch

**Steuer (nur bei Cashflow <0):**
"Steuerlich kannst du [Betrag] € im Jahr sparen (40% Grenzsteuersatz). Echter Verlust: [X] € monatlich."

## ABSATZ 2: RISIKEN & POTENZIAL (50-70W)
<h3>Risiken & Potenzial</h3>

Identifiziere DAS größte Risiko basierend auf delta-Werten:
- Miete >10% über Markt → "Risiko: Mieterwechsel, dann [Betrag] € Cashflow-Verlust"
- Kaufpreis >10% über Markt → "Risiko: Überzahlt, schwer wiederverkaufbar"
- Kaufpreis <-10% unter Markt → "Risiko: Versteckte Mängel? Prüf WEG!"

Zeige auch Potenzial auf: "Aber: [Kaufpreis fair / Miete stabil / etc.]"

## ABSATZ 3: EMPFEHLUNG (40-60W)
<h3>Meine Empfehlung</h3>

2-3 konkrete Handlungsschritte - **LOGISCH basierend auf Zahlen!**

**WICHTIG: Empfehlungen müssen zu Fakten passen!**
- Kaufpreis UNTER Markt → NICHT "weiter verhandeln"! Sondern: "Preis ist ok, aber WEG checken"
- Kaufpreis ÜBER Markt → "Verhandle auf [X] €/m²"
- Miete ÜBER Markt → "Kalkuliere konservativ"

Beispiel bei fairem Kaufpreis:
"1) WEG-Unterlagen prüfen (Rücklagen, Sanierungen). 2) Zustand checken - niedriger Preis kann Grund haben. 3) Notarvertrag genau lesen."

Beispiel bei hohem Kaufpreis:
"1) Kaufpreis runterverhandeln auf [X] €/m². 2) Sonst Finger weg - zu teuer."

## ABSATZ 4: FAZIT (20-30W)
<h3>Fazit</h3>

**NICHT mit "Ja/Nein" starten!** Neutrale Bewertung.

Beispiele:
- "Solides Investment mit gutem Cashflow. Bei sauberen WEG-Unterlagen empfehlenswert."
- "Zu riskant durch Negativcashflow und überteuerten Preis. Erst nach Verhandlung überdenken."
- "Grenzwertig. Wenn du Kaufpreis um 10% drückst, kann's funktionieren. Sonst eher nein."

# VERBOTEN
❌ Lage/Miete/Kauf WIEDERHOLEN (steht schon oben im UI!)
❌ Markdown (##) - nur HTML (<h3>)
❌ Absolute Zahlen (Kaufpreis 685.000 €)
❌ Illogische Empfehlungen ("Verhandle" wenn Preis bereits fair)

# TONFALL
Wie ein Kumpel beim Bier: Ehrlich, locker, kurze Sätze.`,
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

  // 2. Erwartete Sections vorhanden (angepasst an neue Struktur)
  const requiredSections = ['Die Zahlen', 'Risiken', 'Empfehlung', 'Fazit'];
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
