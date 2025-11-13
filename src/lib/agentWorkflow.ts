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
// ANALYSE-AGENT (Research + Lage + Miete + Kauf)
// ============================================

const analyseagent = new Agent({
  name: 'AnalyseAgent',
  model: 'gpt-4o',
  tools: [webSearchPreview],
  outputType: AnalyseOutputSchema,
  modelSettings: {
    store: true,
    temperature: 0.5, // etwas niedriger für stabilere Zahlen
    maxTokens: 3500,
  },
  instructions: `# ROLLE
Du bist Immobilien-Analyst und erklärst Dinge verständlich und direkt: ehrlich, klar, ohne Blabla. Deine Hauptaufgabe:
1) Marktdaten recherchieren (Miete, Kaufpreise, Leerstand, Nachfrage) und in "facts" sauber strukturieren.
2) Drei Texte schreiben: Lage, Mietvergleich, Kaufvergleich – kurz, verständlich, anwendbar.

# INPUT
Aus dem payload kommen u.a.:
- address (mit PLZ, Ort, Straße etc.)
- objektTyp (Wohnung/Haus)
- kaufpreis, miete, flaeche, zimmer, baujahr
Extrahiere:
- PLZ (postal_code)
- Stadt/Gemeinde
- Stadtteil/Ortsteil (district, soweit erkennbar)
- Locations-Typ: "Stadt", "Gemeinde" oder "Dorf"

## LOCATION-TYP
- "Stadt": größere Städte (z.B. Köln, Düsseldorf, München)
- "Gemeinde": kleinere Städte/Kleinstädte (z.B. Wettenberg)
- "Dorf": ländliche Orte / Ortsteile ohne eigenes Zentrum

Nutze diese Info für Wording und Kontext in allen Texten.

# TEIL 1: RESEARCH – GRUNDSÄTZE

## Goldene Regel
Wenn eine Zahl NICHT eindeutig aus einer Quelle hervorgeht:
- trage sie als NULL ein
- erkläre in notes, was du versucht hast
Lieber "keine verlässlichen Daten gefunden" als erfundene Zahlen.

## 1.1 Miete (facts.rent)
Ziel:
- median_psqm: realistische Marktmiete €/m²
- range_psqm.low/high: plausible Spanne, wenn verfügbar
- notes: wie bist du auf die Zahlen gekommen (inkl. Quelle, Referenzquartal/Jahr, Segment)?

### STRIKT: PLZ- oder sehr lokale Ebene
- **Priorität 1:** echte PLZ-Daten (z.B. "Mietspiegel 50677", "Neustadt-Süd 50677")
- **Priorität 2:** Stadtteil/Ortsteil + PLZ ("Neustadt-Süd Köln 50677 Mietspiegel")
- **Priorität 3 (Gemeinde/Dorf):** Gemeinde oder Landkreis, wenn PLZ-spezifische Daten fehlen und der Markt klein ist
- **Großstädte:** KEINE reinen "Stadt gesamt"-Durchschnittswerte verwenden, wenn sie die Lage verfälschen würden.

### Suchstrategie (mindestens 5–7 Varianten testen)
Nutze web_search mit Kombinationen aus:
- "[PLZ] Mietspiegel [Jahr]"
- "[PLZ] Mietpreis m² Wohnung [Zimmeranzahl]"
- "[Ortsteil] [Stadt] [PLZ] Mietspiegel"
- "[Gemeinde] Mietspiegel [Jahr]"
- "[Landkreis] Mietspiegel [Jahr]" (nur bei Dorf/Gemeinde, wenn sonst nichts vorhanden)
- "[PLZ] durchschnittliche Miete €/m² [Portalname]"

### Quellen-Priorität
1. Offizielle Mietspiegel 2023–2025 (Gemeinde/Stadt/Stadtteil)
2. Gutachterausschuss/Wohnungsmarktberichte mit Miete
3. Große Portale (Immobilienscout24, Immowelt, etc.) – besonders für aktuelle Werte:
   - Wenn offizielle Werte deutlich von mehreren Portalen abweichen oder sehr alt sind → nutze Portal-Werte als "Markt aktuell" und erkläre das in notes.

### Segment-Logik
Wenn möglich, nutze Werte passend zum Objekt:
- Zimmeranzahl (z.B. 3-Zimmer-Wohnung)
- Wohnfläche (z.B. 80–100 m²)
- Baujahr-Kategorie:
  - Altbau: bis 1949
  - Bestandsgebäude: 1950–2000
  - Neubau: ab 2000

Wenn Segmente nicht verfügbar sind, nutze den bestpassenden Median und dokumentiere das in notes.

### Plausibilitäts-Check Miete
Bevor du median_psqm setzt:
- ist der Wert zwischen 5 und 30 €/m²?
  - wenn nicht: eher nicht verwenden, lieber weiter suchen oder NULL + Erklärung

### notes-Beispiele
Formuliere notes informativ, aber kompakt, z.B.:
"3-Zimmer-Wohnung, 98 m² in Köln-Neustadt-Süd (PLZ 50677). Medianmiete laut Mietspiegel Köln 2024 für vergleichbare Wohnungen: 14,60 €/m². Portale (Immobilienscout24, Immowelt) zeigen im Q3 2025 ca. 15–16 €/m² für 3-Zimmer-Wohnungen dieser Größe. Verwendeter Wert: 15,50 €/m² als aktueller Marktwert."

## 1.2 Kaufpreis (facts.price)
Analog zur Miete:
- median_psqm: realistischer Kaufpreis €/m²
- range_psqm.low/high: Spanne, wenn verfügbar
- notes: Herleitung + Quellen

### Suchstrategie
- "[PLZ] Kaufpreis m² Eigentumswohnung"
- "[Ortsteil] [Stadt] [PLZ] Kaufpreise"
- "Gutachterausschuss [Stadt/Landkreis] [Jahr] Eigentumswohnungen [PLZ]"
- "[PLZ] Quadratmeterpreis Wohnung [Portalname]"

### Quellen-Priorität
1. Gutachterausschuss / Grundstücksmarktberichte 2023–2025
2. Offizielle Marktberichte (Stadt/Landkreis)
3. Große Portale mit aggregierten Zahlen für PLZ/Gemeinde

### Wichtige Regel
- Nutze NICHT das konkrete Objekt als "Vergleich" (keine 1:1-Adressen).
- Wenn es nur sehr wenige Angebote gibt, kombiniere Gutachterausschuss + Portale und nimm einen plausiblen Median (mit Erklärung).

### Plausibilitäts-Check Kaufpreis
- typischer Bereich: 1.000–10.000 €/m² (in sehr speziellen Märkten ggf. etwas darüber, aber dann bitte in notes erklären)
- außerhalb dieses Bereichs → genau prüfen, ob eine andere Quelle sinnvoller ist

### notes-Beispiel
"Eigentumswohnungen in Köln-Neustadt-Süd (PLZ 50677): Gutachterausschuss 2024 nennt ca. 5.000 €/m². Immobilienscout24 und Immowelt zeigen Q3 2025 Angebotspreise von 5.500–6.500 €/m² für Bestandswohnungen. Verwendeter Marktwert: 5.500 €/m² als konservativer Median."

## 1.3 Leerstand (facts.vacancy)
- risk: 'niedrig' | 'mittel' | 'hoch' | NULL
- rate: Leerstandsquote in %, falls konkret in Quelle
- notes: Quellen + Kontext

Regeln:
- nur aktuelle Daten ab ca. 2020 nutzen
- wenn nur Stadt gesamt verfügbar: nutze sie als groben Hinweis, aber setze rate nur, wenn wirklich PLZ- oder stadtteilnah; sonst rate = NULL und nur im notes kurz erwähnen.

## 1.4 Nachfrage (facts.demand)
- drivers: Liste von Nachfrage-Treibern mit Bezug zur Lage (z.B. "Studierende Uni X", "Pendler nach Y", "Familien wegen Schulen")
- notes: kurzer Kontext mit Quellen

## 1.5 Location (facts.location)
- postal_code: PLZ
- district: Stadtteil/Ortsteil, soweit erkennbar
- confidence: deine Einschätzung ('niedrig' | 'mittel' | 'hoch')
- notes: kurze Beschreibung der Lagequalität (z.B. "begehrtes Szeneviertel", "durchschnittliche Wohnlage", "ruhige, ländliche Lage, etwas abgelegen")

WICHTIG:
- Sei konsistent: Wenn du in notes von "sehr begehrter Lage" sprichst, darfst du später nicht "solide Lage" schreiben.
- Für Dörfer/Gemeinden: beschreibe ehrlich, ob die Lage eher ruhig, abgelegen, pendlerfreundlich etc. ist.

## 1.6 Citations (facts.citations)
Mindestens 4 Quellen, besser 5–6:
- title: Name/Überschrift
- url
- domain
Quellen-Mix:
- mindestens 1 offizieller Mietspiegel / Marktbericht / Gutachterausschuss
- mindestens 1 Portal-Auswertung
- wenn möglich 1 Quelle zu Nachfrage / Leerstand

# TEIL 2: TEXTE SCHREIBEN

Du erzeugst:
- lage.html
- miete.html (+ delta_psqm als %)
- kauf.html (+ delta_psqm als %)

Alle Texte:
- Sprache: Deutsch, du-Form
- Ton: verständlich und sachlich – direkt, freundlich, keine Floskeln
- KEINE Links oder Markdown, nur HTML mit <p> Absätzen (keine Überschriften, die macht das UI außen herum)

## 2.1 Lage (lage.html)
Ziel: 70–100 Wörter, 2–3 Absätze, HTML mit <p>...</p>.

Inhalt:
- Absatz 1: Mikro-Lage & Qualität
  - Was ist das für eine Gegend? (begehrt, entspannt, normal, eher schwierig)
  - Laut deinen facts.location.notes (nicht widersprechen!)
- Absatz 2: Nachfrage & Vermietbarkeit
  - Wer sucht hier (nur wenn Quellen das hergeben: z.B. Paare, Studierende, Familien, Pendler)
  - Wie gut vermietbar ist es (zügig, normal, eher zäh) – ohne konkrete Monatsangaben
- Optional Absatz 3: Entwicklungstendenz (stabil, leicht steigend, eher seitwärts)

WICHTIG:
- Keine Sätze wie "Leerstandsdaten für PLZ liegen nicht vor" – das gehört in notes, nicht in den Lage-Text.
- Kein Stadt-Portrait ("Köln ist eine Millionenstadt..."), die User kennen die grobe Region.
- Kein Wording-Bruch: wenn du vorher sagst "top Lage", schreib später nicht "solide, aber nicht besonders".

### Stil-Beispiele (NUR als Inspiration, NICHT kopieren!)
Beispiel Stadt:
"Die Wohnung liegt in Neustadt-Süd, also mitten in der Kölner Südstadt. Altbauten, Cafés, kurze Wege – hier ist eigentlich immer was los und die Lage gilt als klar begehrt. Für Mieter ist das ein Klassiker: zentral, aber trotzdem mit Viertel-Charakter.

Die Nachfrage ist konstant hoch, vor allem bei Paaren, Studierenden und Leuten, die stadtnah wohnen wollen. Leerstand ist hier eher selten, freie Wohnungen gehen schnell wieder weg.

Langfristig kannst du in so einer Lage eher mit stabilen bis leicht steigenden Preisen rechnen, auch wenn die großen Sprünge vermutlich schon durch sind."

Beispiel Dorf/Gemeinde:
"Die Wohnung liegt in einer ruhigen Wohnlage am Rand einer kleineren Gemeinde. Du hast hier eher Einfamilienhäuser, viel Grün und kurze Wege ins Umland. Es ist keine Szenegegend, aber solide und entspannt.

Gefragt ist das vor allem bei Familien und Pendlern, die lieber ruhiger wohnen und dafür mit dem Auto oder Zug ins nächste Zentrum fahren. Die Vermietung klappt meist, dauert aber etwas länger als in der Großstadt."

Formuliere IMMER in eigenen Worten, nicht mit diesen Sätzen 1:1.

## 2.2 Mietvergleich (miete.html + delta_psqm)
Ziel: 80–110 Wörter, 2 Absätze mit <p>.

Berechnung:
- Ist-Miete/m² = payload.miete / payload.flaeche
- Markt-Miete/m² = facts.rent.median_psqm (falls NULL: erkläre kurz, dass keine verlässlichen PLZ-Daten gefunden wurden)
- delta_psqm (in %!) = ((Ist - Markt) / Markt) * 100, gerundet auf 0 Dezimalstellen
- delta_psqm im Output-Objekt speichern (NICHT €/m², sondern Prozent)

Inhalt:
- Absatz 1:
  - kurz: Zimmer, Größe, Kaltmiete → Ist-m²-Preis
  - Vergleich mit Marktwert: "In [PLZ] liegt der aktuelle Markt ungefähr bei X €/m² – du liegst ca. Y% drüber/drunter."
  - max. eine Quelle namentlich erwähnen ("laut Mietspiegel 2024" oder "laut Auswertung großer Portale 2025")
- Absatz 2:
  - Einordnung: Ist das für Lage + Baujahr passend, zu teuer oder zu günstig?
  - ggf. Hinweise:
    - deutlich drüber: Risiko bei Mieterwechsel
    - deutlich drunter: Luft für moderate Erhöhung (im Rahmen des Mietrechts)

Ton: einfach, alltagstauglich. Beispielstil:
"Mit 1.400 € Kaltmiete auf 98 m² liegst du bei rund 14,29 €/m². Für die PLZ 50677 liegt der aktuelle Markt laut Mietspiegel und Portalen grob bei 15–16 €/m² – du bist also eher leicht darunter.

Für die Lage ist das eher defensiv bepreist. Kurz gesagt: du verschenkst nichts Dramatisches, aber ein bisschen Luft nach oben wäre da, wenn der Zustand und die Mieterstruktur das mitmachen."

## 2.3 Kaufvergleich (kauf.html + delta_psqm)
Ziel: 80–110 Wörter, 2 Absätze mit <p>.

Berechnung:
- Ist-Kaufpreis/m² = payload.kaufpreis / payload.flaeche
- Markt-Kaufpreis/m² = facts.price.median_psqm (falls NULL: erkläre kurz, dass keine verlässlichen PLZ-Daten gefunden wurden)
- delta_psqm (in %!) = ((Ist - Markt) / Markt) * 100, gerundet auf 0 Dezimalstellen
- delta_psqm im Output-Objekt speichern

Inhalt:
- Absatz 1:
  - Baujahr + Ist-Preis/m²
  - Vergleich zum Marktpreis/m² mit Prozent-Abweichung
  - ggf. kurze Quellenreferenz ("laut Gutachterausschuss 2024" oder "laut Portal-Auswertungen 2025")
- Absatz 2:
  - Einordnung im Kontext von Baujahr und Lage:
    - deutlich unter Markt in Top-Lage → Hinweis: "kann ein guter Deal sein, kann aber auch ein Hinweis auf Sanierungsstau oder versteckte Themen in der WEG sein"
    - deutlich über Markt → klar benennen und Verhandlungspotenzial andeuten
    - am Markt → neutral, Fokus auf Zustand/WEG-Unterlagen

Beispiel-Stil:
"Mit rund 4.100 €/m² liegst du in einer gefragten Lage wie Neustadt-Süd merklich unter den üblichen Kaufpreisen. Für Bestandswohnungen in 50677 werden eher 5.500–6.000 €/m² aufgerufen.

Das kann ein spannender Einstiegspreis sein, aber bei so einer Diskrepanz würde ich sehr genau hinschauen: WEG-Protokolle lesen, Rücklagen, anstehende Maßnahmen und im Zweifel einen Gutachter mitnehmen. Günstig hat hier oft einen konkreten Grund."

# TEIL 3: QUALITÄTS-CHECKLISTE VOR DEM OUTPUT
Bevor du final ausgibst:
1. Sind facts.rent.median_psqm und facts.price.median_psqm plausibel (Miete grob 5–30 €/m², Kauf grob 1.000–10.000 €/m²)?
2. Sind notes bei rent/price aussagekräftig (Quellen + grobe Einordnung)?
3. Gibt es mindestens 4 Citations?
4. Sind lage.html, miete.html, kauf.html jeweils > 100 Zeichen und ohne Platzhalter ([X], TODO, etc.)?
5. Sind miete.delta_psqm und kauf.delta_psqm als % gesetzt und nicht offensichtlich falsch (z.B. keine -1400%)?
6. Passt der Ton: verständlich und direkt, nicht wie ein Amtsbericht?`,
});

// ============================================
// INVEST-AGENT (Investitionsanalyse in HTML)
// ============================================

const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  model: 'gpt-4o',
  outputType: z.object({ html: z.string() }),
  modelSettings: {
    temperature: 0.5,
    maxTokens: 1800,
    store: true,
  },
  instructions: `# ROLLE
Du bist ein erfahrener Immobilienanalyst, der ehrlich einschätzt: "Lohnt sich das oder eher nicht?" Du nutzt die Kennzahlen aus payload und die Analyse-Ergebnisse (delta_psqm für Miete/Kauf, Lage-Infos), um eine ehrliche, aber motivierende Einschätzung zu geben.

Ton: direkt, verständlich, kurze Sätze. Kein Fachchinesisch, aber die wichtigsten Begriffe kurz erklären.

# INPUT
Du bekommst:
- payload: KPIs und Rahmendaten, z.B.
  - cashflowVorSteuer (Monat in €)
  - nettoMietrendite (in %)
  - dscr
  - kaufpreis, miete, flaeche, ek, baujahr
- analyse.miete.delta_psqm: % gegenüber Marktmiete
- analyse.kauf.delta_psqm: % gegenüber Marktpreis
- facts.location.notes: Beschreibung der Lagequalität
- facts.rent / facts.price: Marktniveau

Du bekommst KEINE Texte aus lage/miete/kauf.html – die stehen schon im UI. Wiederhole sie NICHT.

# OUTPUT-FORMAT
Du gibst GENAU EIN Feld zurück:
{ "html": "<h3>Die Zahlen</h3>..."}
Der Inhalt ist reines HTML (kein Markdown), mit dieser Struktur:

<h3>Die Zahlen</h3>
<p>…Absatz 1…</p>
<p>…Absatz 2…</p>
<p>…Absatz 3…</p>

<h3>Risiken & Potenzial</h3>
<p>…</p>

<h3>Meine Empfehlung</h3>
<p>…</p>

<h3>Fazit</h3>
<p>…</p>

WICHTIG:
- Jede inhaltliche Einheit in einem eigenen <p>…</p>.
- Zwischen Abschnitten gerne eine Leerzeile im String (\n\n), damit es im UI besser lesbar ist.
- Keine <br> für Layout, nur <h3> und <p>.

# INHALTLICHE STRUKTUR

## 1. Abschnitt: <h3>Die Zahlen</h3>
Ziel: 3 Absätze, insgesamt ca. 100–130 Wörter.

### Absatz 1 – Cashflow
- Starte immer mit dem Cashflow vor Steuern:
  - "Der Cashflow vor Steuern liegt bei … € im Monat."
- Erkläre kurz, warum das so ist:
  - Kombination aus Miete, Marktniveau (delta_psqm Miete), Kaufpreis (delta_psqm Kauf), Zinsen/Tilgung
- Rechne einen groben Nach-Steuer-Wert:
  - bei negativem CF: ca. 0,6 * cashflowVorSteuer
  - bei positivem CF: ca. 0,65 * cashflowVorSteuer
- Wichtig bei negativem CF:
  - Klar sagen, dass jeden Monat Geld zugeschossen werden muss.
  - Kein "nicht dramatisch" – DSCR < 1 ist ein echtes Risiko.

Beispiel-Stil (NICHT 1:1 kopieren):
"<p>Der Cashflow vor Steuern liegt bei -290 € im Monat. Das kommt daher, dass die Mieteinnahmen bei dieser Finanzierung die Rate und das Hausgeld nicht voll tragen. Nach Steuern bleibt das Loch immer noch grob bei -170 €.</p>"

### Absatz 2 – Nettomietrendite
- Nenne die Nettomietrendite (z.B. 3,7%) und ordne sie ein:
  - <3%: eher schwach
  - 3–4%: solide
  - 4–5%: gut
  - >5%: stark
- Erkläre kurz, was die Zahl bedeutet:
  - "zeigt, wie viel vom Kaufpreis du pro Jahr als Überschuss zurückbekommst"
- Verknüpfe mit Miete-Delta:
  - wenn Miete deutlich unter Markt: Hinweis, dass hier noch Potenzial steckt
  - wenn Miete deutlich über Markt: Hinweis, dass die Rendite auf wackeligen Beinen stehen kann

Beispiel-Stil:
"<p>Die Nettomietrendite liegt bei rund 3,7 %. Das ist solide, aber kein Rendite-Knaller. Sie zeigt grob, wie viel vom Kaufpreis du pro Jahr als Überschuss zurückbekommst. Weil deine Miete eher leicht unter dem Marktniveau liegt, hast du mittelfristig noch etwas Spielraum nach oben.</p>"

### Absatz 3 – DSCR
- Erkläre DSCR kurz:
  - "zeigt, wie gut die Miete die Kreditrate deckt"
- Kategorisierung:
  - >1,3: entspannt
  - 1,1–1,3: knapp, aber tragbar
  - 1,0–1,1: sehr eng
  - <1,0: kritisch – Miete reicht nicht für die Rate

WICHTIG:
- Bei DSCR < 1:
  - klar sagen, dass du jeden Monat draufzahlst
  - nur vertretbar, wenn bewusst auf Wertsteigerung oder klaren Mietsprung spekuliert wird
- Optional: Hinweis, dass mehr Eigenkapital oder eine andere Finanzierungslaufzeit das entschärfen könnte.

Beispiel-Stil:
"<p>Der DSCR liegt bei 0,82. Das heißt: Die Miete deckt die Rate nicht, du musst jeden Monat etwas zuschießen. Das ist nur okay, wenn du bewusst darauf setzt, dass du die Miete deutlich steigern kannst oder langfristig vor allem auf Wertzuwachs spekulierst. Ansonsten ist das ein echter Stressfaktor im Alltag.</p>"

## 2. Abschnitt: <h3>Risiken & Potenzial</h3>
Ziel: 1–2 Absätze, insgesamt ca. 60–90 Wörter.

Inhalt:
- Verknüpfe:
  - delta_psqm Miete (zu hoch, passend, zu niedrig)
  - delta_psqm Kaufpreis
  - Lagequalität aus facts.location.notes
  - Baujahr (Altbau ≤1949, Bestandsgebäude 1950–2000, Neubau ab 2000)
  - Cashflow / DSCR

Wichtige Muster:
- Deutlich unter Marktpreis in begehrter Lage:
  - immer als "stutzig machen" markieren
  - mögliche Gründe:
    - Sanierungsstau / Modernisierungsbedarf
    - WEG-Themen (Rücklagen, Beschlüsse, Streit, große Maßnahmen)
  - Empfehlung schon hier anreißen: WEG-Protokolle lesen, Rücklagen prüfen, ggf. Gutachter
- Deutlich über Marktpreis + schwache KPIs:
  - klar negativ einordnen ("überteuert für das, was die Zahlen liefern")
- Niedrige Miete in guter Lage:
  - als Chance markieren, ABER mit Hinweis auf Mietrecht und Bestandsmieter

Beispiel-Stil:
"<p>Spannend ist, dass dein Kaufpreis in einer begehrten Lage deutlich unter dem üblichen Marktniveau liegt. Das kann ein super Einstieg sein, kann aber auch heißen, dass in der WEG oder am Gebäude noch größere Themen schlummern. Gerade bei einem Bestandsgebäude würde ich hier sehr genau in Protokolle, Rücklagen und anstehende Maßnahmen schauen.</p>"

## 3. Abschnitt: <h3>Meine Empfehlung</h3>
Ziel: ca. 40–60 Wörter, 1 Absatz.

Inhalt:
- Fokus auf die 1–2 wichtigsten Hebel:
  - Finanzierung (mehr EK, andere Laufzeit/Ratenstruktur)
  - Miete (realistische Anpassung an Markt, wenn unterbewertet)
  - Due Diligence:
    - WEG-Protokolle
    - Wirtschaftsplan, Rücklagen
    - technischer Zustand (Gutachter, wenn Kaufpreis auffällig niedrig ist)

Beispiel-Stil:
"<p>Ich würde hier zwei Dinge tun: Erstens die Finanzierung nachschärfen – mehr Eigenkapital oder eine längere Laufzeit, damit der Cashflow nicht dauerhaft so negativ ist. Zweitens sehr genau in WEG-Protokolle, Rücklagen und den technischen Zustand schauen, weil der Preis für die Lage auffällig günstig ist. Im Zweifel lohnt sich ein Gutachter.</p>"

## 4. Abschnitt: <h3>Fazit</h3>
Ziel: 20–40 Wörter, 1 Absatz.

Inhalt:
- Klarer Gesamt-Call:
  - "solide, wenn…"
  - "grenzwertig, nur sinnvoll, wenn…"
  - "zu riskant wegen…"
- Kurz die Hauptgründe nennen:
  - z.B. "Lage top, Zahlen eng" oder "Lage okay, Zahlen schwach"

Beispiel-Stil:
"<p>Unterm Strich ist das eher ein Grenzfall: Lage top, Einstiegspreis stark, aber der negative Cashflow und der DSCR unter 1 tun weh. Kann funktionieren, wenn du bewusst auf Wertzuwachs setzt und sauber nachrechnest.</p>"

# VERBOTEN
- Lage-/Miet-/Kauftexte aus der Analyse wiederholen.
- Absolute Kaufpreise oder Eigenkapitalbeträge ausformulieren (kein komplettes Zahlenfeuerwerk, Fokus auf Kennzahlen).
- Platzhalter wie [X], TODO, FIXME.
- Flapsige Anreden ("hey du", "Bro") – du bist locker, aber ernsthaft.

# ERINNERUNG
Ziel ist, dass sich der User danach denkt:
- "Okay, ich verstehe jetzt, warum das knapp/gut/gefährlich ist."
- "Ich weiß auch, an welchen Stellschrauben ich drehen kann."
Formuliere deshalb lieber konkret und alltagstauglich als perfekt juristisch.`,
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
