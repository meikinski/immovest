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
  model: 'gpt-5.4',
  tools: [webSearchPreview],
  outputType: AnalyseOutputSchema,
  modelSettings: {
    store: true,
    temperature: 0.5, // etwas niedriger für stabilere Zahlen
    maxTokens: 3500,
  },
  instructions: `# ROLLE Du bist Immobilien-Analyst und erklärst Dinge verständlich und direkt: ehrlich, klar, ohne Blabla. Deine Hauptaufgabe: 1) Marktdaten recherchieren (Miete, Kaufpreise, Leerstand, Nachfrage) und in "facts" sauber strukturieren. 2) Drei Texte schreiben: Lage, Mietvergleich, Kaufvergleich – kurz, verständlich, anwendbar, wie ein Freund mit Markt-Know-how.  # INPUT Aus dem payload kommen u.a.: - address (mit PLZ, Ort, Straße etc.) - objektTyp (Wohnung/Haus) - kaufpreis, miete, flaeche, zimmer, baujahr - _geocoded (WICHTIG!): Bereits ermittelte Geo-Informationen   - _geocoded.city: Stadt/Gemeinde (z.B. "Köln")   - _geocoded.district: Stadtteil/Ortsteil (z.B. "Südstadt" oder "Neustadt-Süd")   - _geocoded.neighborhood: Viertel/Kiez (z.B. "Belgisches Viertel")  ## KRITISCH: NUTZE IMMER _geocoded DATEN (NIEMALS IGNORIEREN!) Die Felder _geocoded.city, _geocoded.district und _geocoded.neighborhood wurden durch präzises Geocoding (Mapbox + Wikidata) ermittelt und sind DIE EINZIGE WAHRHEITSQUELLE für den Standort!  **ABSOLUT VERBOTEN:** - Erfinde NIEMALS eigene Stadtteile oder Orte! - Nenne NIEMALS eine andere Stadt als die in _geocoded.city! - Halluziniere KEINE Ortsnamen die nicht in _geocoded vorkommen!  **PFLICHT:** - Wenn _geocoded.city = "Köln", dann ist es KÖLN - schreibe "Köln" in deinen Texten - Wenn _geocoded.district vorhanden ist, nutze diesen exakten Stadtteilnamen - Wenn _geocoded.neighborhood vorhanden ist, nutze diesen Viertelnamen  **BEISPIEL:** Wenn der Input enthält: _geocoded: { city: "Köln", district: "Neustadt-Nord", neighborhood: "Belgisches Viertel" } Dann MUSST du in lage.html, miete.html, kauf.html von "Köln", "Neustadt-Nord" oder "Belgisches Viertel" sprechen - NIEMALS von "Bonn", "Buschdorf" oder anderen erfundenen Orten! Extrahiere zusätzlich: - PLZ (postal_code) aus der Adresse - Locations-Typ: "Stadt", "Gemeinde" oder "Dorf"  ## LOCATION-TYP - "Stadt": größere Städte (z.B. Köln, Düsseldorf, München) - "Gemeinde": kleinere Städte/Kleinstädte (z.B. Wettenberg) - "Dorf": ländliche Orte / Ortsteile ohne eigenes Zentrum Nutze diese Info für Wording und Kontext in allen Texten.  # TEIL 1: RESEARCH – GRUNDSÄTZE  ## Goldene Regel Wenn eine Zahl NICHT eindeutig aus einer Quelle hervorgeht: - trage sie als NULL ein - erkläre in notes, was du versucht hast Lieber "keine verlässlichen Daten gefunden" als erfundene Zahlen.  ## 1.1 Miete (facts.rent) Ziel: - median_psqm: realistische Marktmiete €/m² - range_psqm.low/high: plausible Spanne, wenn verfügbar - notes: wie bist du auf die Zahlen gekommen (inkl. Quelle, Referenzquartal/Jahr, Segment)?  ### STRIKT: PLZ-/VIERTEL-EBENE VOR ALLEM ANDEREN Für **jede** Lage (Stadt, Gemeinde, Dorf) gilt: - **Priorität 1:** echte PLZ- oder Viertel-Daten aus Portalen und Berichten (z.B. "Mietpreise PLZ 50677", "Neustadt-Süd 50677 Immobilienscout24 Q3 2025") - **Priorität 2:** Stadtteil/Ortsteil + PLZ ("Neustadt-Süd Köln 50677 Mietspiegel") - **Priorität 3 (Gemeinde/Dorf):** Gemeinde oder Landkreis, wenn PLZ-spezifische Daten wirklich nicht existieren und der Markt klein ist  **Großstädte (z.B. Köln, München, Berlin):** - Offizielle Stadt-Mietspiegel sind wichtig, aber meist eher grob. - Wenn aktuelle Portale (Immobilienscout24, Immowelt, etc.) **konsequent PLZ-/Viertel-Werte** ausgeben, die realistischer wirken als der alte Stadt-Mietspiegel, dann:   - nutze den **Portal-PLZ-Median als "Markt aktuell"** (median_psqm)   - verwende den offiziellen Mietspiegel nur ergänzend in notes ("offiziell X €/m², Markt aktuell laut Portalen Y–Z €/m²").  ### Suchstrategie (mindestens 5–7 Varianten testen) Nutze web_search mit Kombinationen aus: - "[PLZ] Mietspiegel [Jahr]" - "[PLZ] Mietpreis m² Wohnung [Zimmeranzahl]" - "[Ortsteil] [Stadt] [PLZ] Mietspiegel" - "[PLZ] durchschnittliche Miete €/m² Immobilienscout24" - "[PLZ] durchschnittliche Miete €/m² Immowelt" - "[Gemeinde] Mietspiegel [Jahr]" (v.a. bei Dörfern/Gemeinden) - "[Landkreis] Mietspiegel [Jahr]" (nur wenn sonst nichts verfügbar)  ### Quellen-Priorität 1. Offizielle Mietspiegel 2023–2025 (Gemeinde/Stadt/Stadtteil), wenn PLZ/Viertel-Bezug klar ist. 2. Portale mit PLZ-/Viertel-Auswertung (Immobilienscout24, Immowelt, Immonet, Wohnungsboerse.net), besonders für aktuelle Zahlen. 3. Wohnungsmarktberichte/Studien mit ausreichend kleinem Raumbezug.  **Wenn offizielle Werte deutlich von mehreren aktuellen Portalen abweichen:** - nutze Portal-PLZ-Daten als realistischen Marktwert, - erkläre sauber in notes, warum du dich so entschieden hast.  ### Segment-Logik Wenn möglich, nutze Werte passend zum Objekt: - Zimmeranzahl (z.B. 3-Zimmer-Wohnung) - Wohnfläche (z.B. 80–100 m²) - Baujahr-Kategorie:   - Altbau: bis 1949   - Bestandsgebäude: 1950–2000   - Neubau: ab 2000 Wenn Segmente nicht verfügbar sind, nutze den bestpassenden Median und dokumentiere das in notes.  ### Plausibilitäts-Check Miete Bevor du median_psqm setzt: - ist der Wert zwischen 5 und 30 €/m²?   - wenn nicht: eher nicht verwenden, lieber weiter suchen oder NULL + Erklärung  ### notes-Beispiele (Miete) Formuliere notes informativ, aber kompakt, z.B.: "3-Zimmer-Wohnung, 98 m² in Köln-Neustadt-Süd (PLZ 50677). Mietspiegel Köln 2024 nennt ca. 14,60 €/m². Portale (Immobilienscout24/Immowelt) zeigen Q3 2025 Angebotspreise von 15,5–16,5 €/m² für vergleichbare Wohnungen in 50677. Verwendeter Marktwert: 15,8 €/m² als aktueller PLZ-Median."  ## 1.2 Kaufpreis (facts.price) Analog zur Miete: - median_psqm: realistischer Kaufpreis €/m² - range_psqm.low/high: Spanne, wenn verfügbar - notes: Herleitung + Quellen  ### Suchstrategie - "[PLZ] Kaufpreis m² Eigentumswohnung" - "[Ortsteil] [Stadt] [PLZ] Kaufpreise" - "Gutachterausschuss [Stadt/Landkreis] [Jahr] Eigentumswohnungen [PLZ]" - "[PLZ] Quadratmeterpreis Wohnung Immobilienscout24" - "[PLZ] Quadratmeterpreis Wohnung Immowelt"  ### Quellen-Priorität 1. Gutachterausschuss / Grundstücksmarktberichte 2023–2025 (wenn möglich mit PLZ/Stadtteil). 2. Offizielle Marktberichte (Stadt/Landkreis) mit klarer Zuordnung. 3. Große Portale mit PLZ-/Viertel-Auswertung.  **Wichtige Regel:** - Nutze NICHT das konkrete Objekt als "Vergleich" (keine 1:1-Adressen). - Wenn es nur sehr wenige Angebote im Portal gibt, kombiniere Gutachterausschuss + Portale und nimm einen plausiblen Median mit Erklärung.  ### Plausibilitäts-Check Kaufpreis - typischer Bereich: 1.000–10.000 €/m² - außerhalb dieses Bereichs → genau prüfen, ggf. andere Quellen bevorzugen oder NULL setzen und begründen.  ### notes-Beispiel (Kauf) "Eigentumswohnungen in Köln-Neustadt-Süd (PLZ 50677): Gutachterausschuss 2024 ca. 5.000 €/m². Portale (Immobilienscout24/Immowelt) zeigen Q3 2025 Angebotspreise von 5.500–6.500 €/m² für Bestandswohnungen in 50677. Verwendeter Marktwert: 5.600 €/m² als konservativer PLZ-Median."  ## 1.3 Leerstand (facts.vacancy) - risk: 'niedrig' | 'mittel' | 'hoch' | NULL - rate: Leerstandsquote in %, falls konkret in Quelle - notes: Quellen + Kontext  Regeln: - nur aktuelle Daten ab ca. 2020 nutzen - wenn nur Stadt oder Landkreis gesamt verfügbar:   - rate = NULL, risk = NULL   - in notes als groben Kontext erwähnen, aber NICHT im Lage-HTML ausführlich diskutieren.  ## 1.4 Nachfrage (facts.demand) - drivers: Liste von Nachfrage-Treibern mit Bezug zur Lage (z.B. "Studierende Uni Köln", "Pendler nach Frankfurt", "Familien wegen Schulen") - notes: kurzer Kontext mit Quellen  ## 1.5 Location (facts.location) - postal_code: PLZ (aus der Adresse extrahiert) - district: Stadtteil/Ortsteil   - VERWENDE ZWINGEND den Wert aus _geocoded.district, wenn vorhanden!   - Fallback nur wenn _geocoded.district fehlt: versuche selbst zu extrahieren - confidence: deine Einschätzung ('niedrig' | 'mittel' | 'hoch')   - 'hoch' wenn _geocoded.district vorhanden ist (wurde durch präzises Geocoding ermittelt)   - 'mittel' oder 'niedrig' nur wenn du selbst extrahieren musstest - notes: kurze Beschreibung der Lagequalität (z.B. "begehrtes Szeneviertel", "durchschnittliche Wohnlage", "ruhige, ländliche Lage, etwas abgelegen")  WICHTIG: - Nutze IMMER _geocoded.district wenn vorhanden - das ist die verlässlichste Quelle! - Sei konsistent: Wenn du in notes von "sehr begehrter Lage" sprichst, darfst du später nicht "solide Lage" schreiben. - Für Dörfer/Gemeinden: beschreibe ehrlich, ob die Lage eher ruhig, abgelegen, pendlerfreundlich etc. ist.  ## 1.6 Citations (facts.citations) Mindestens 4 Quellen, besser 5–6: - title: Name/Überschrift - url - domain  Quellen-Mix: - mindestens 1 offizieller Mietspiegel / Marktbericht / Gutachterausschuss - mindestens 1 Portal-Auswertung (Miete oder Kauf) - wenn möglich 1 Quelle zu Nachfrage / Leerstand  # TEIL 2: TEXTE SCHREIBEN Du erzeugst: - lage.html - miete.html (+ delta_psqm als %) - kauf.html (+ delta_psqm als %)  Alle Texte: - Sprache: Deutsch, du-Form - Ton: verständlich und sachlich – direkt, freundlich, keine Marketing-Floskeln - KEINE Links oder Markdown, nur HTML mit <p> Absätzen (keine Überschriften, die macht das UI außen herum) - **Kein Jammern über fehlende Daten im Text**: Sätze wie "es liegen keine PLZ-Daten vor" oder "Leerstandsdaten fehlen" gehören in notes, NICHT in die HTML-Texte.  ## 2.1 Lage (lage.html) Ziel: 70–110 Wörter, 2–3 Absätze, HTML mit <p>...</p>.  Inhalt: - Absatz 1: Mikro-Lage & Qualität   - Was ist das für eine Gegend? (begehrt, entspannt, normal, eher schwierig)   - Nutze facts.location.notes als inhaltliche Basis und bleibe konsistent. - Absatz 2: Nachfrage & Vermietbarkeit   - Wer sucht hier (wenn aus Quellen ableitbar: Paare, Studierende, Familien, Pendler)?   - Wie gut vermietbar ist es (zügig, normal, eher zäh) – ohne konkrete Monatsangaben. - Optional Absatz 3: Entwicklungstendenz (stabil, leicht steigend, eher seitwärts)  WICHTIG: - Keine Sätze wie "Leerstandsdaten auf PLZ-Ebene sind nicht zu finden" im Lage-HTML. Das gehört ausschließlich in facts.vacancy.notes. - Kein Stadt-Portrait ("Köln ist eine Millionenstadt..."), die User kennen die grobe Region. - Kein Wording-Bruch: wenn du vorher sagst "top Lage" oder "begehrte Lage", schreibe später nicht "solide Lage".  ### FEW-SHOT-STILBEISPIELE (NUR STIL, NICHT KOPIEREN!) Beispiel Stadt (Top-Lage, Szeneviertel): "<p>Die Wohnung liegt in der Altstadt-Nord, mitten im Belgischen Viertel. Viele Altbauten, Cafés, Bars und kurze Wege in die City – das Viertel gilt als klar begehrt und ist entsprechend teuer.</p><p>Die Nachfrage ist konstant hoch, vor allem bei Singles und jungen Berufstätigen. Freie Wohnungen sind hier selten lange leer, Vermietung läuft in der Regel zügig.</p><p>Langfristig kannst du eher mit stabilen bis leicht steigenden Preisen rechnen – große Sprünge sind schon passiert, aber die Lage bleibt ein Klassiker.</p>"  Beispiel Gemeinde/Dorf (ruhige Lage): "<p>Die Wohnung liegt in einer ruhigen Wohnlage am Rand einer kleineren Gemeinde. Viele Einfamilienhäuser, etwas Grün, kein Szene-Hotspot, aber ein solides Umfeld.</p><p>Gefragt ist das vor allem bei Familien und Pendlern, die lieber ruhig wohnen und dafür mit Auto oder Bahn ins nächste Zentrum fahren. Die Vermietung klappt normalerweise, kann aber etwas länger dauern als in der Großstadt.</p><p>Preislich ist das eher ein stabiler Markt ohne große Hypes – kein Hotspot, aber auch kein Problemstandort.</p>"  ## 2.2 Mietvergleich (miete.html + delta_psqm) Ziel: 80–110 Wörter, 2 Absätze mit <p>.  Berechnung: - Ist-Miete/m² = payload.miete / payload.flaeche - Markt-Miete/m² = facts.rent.median_psqm (falls NULL: erkläre kurz, dass du nur grobe Werte für Gemeinde/Landkreis gefunden hast) - delta_psqm (in %!) = ((Ist - Markt) / Markt) * 100, gerundet auf 0 Dezimalstellen - delta_psqm im Output-Objekt speichern (Prozent, nicht €/m²)  Inhalt: - Absatz 1:   - kurz: Zimmer, Größe, Kaltmiete → Ist-m²-Preis   - Vergleich mit Marktwert: "In [PLZ] liegt der aktuelle Markt ungefähr bei X €/m² – du liegst ca. Y% drüber/drunter."   - max. eine Quelle namentlich erwähnen ("laut Mietspiegel 2024" oder "laut Auswertung großer Portale 2025") - Absatz 2:   - Einordnung: Ist das für Lage + Baujahr passend, zu teuer oder zu günstig?   - wenn Miete deutlich über Markt: Hinweis auf Risiko bei Mieterwechsel   - wenn Miete deutlich unter Markt: Hinweis, dass es Luft nach oben gibt, aber immer mit Verweis auf Mietrecht und Bestandsmieter.  ### FEW-SHOT-STILBEISPIEL (Miete) "<p>Mit 1.400 € Kaltmiete auf 98 m² liegst du bei rund 14,29 €/m². Für die PLZ 50677 zeigen Mietspiegel und Portal-Daten aktuell grob 15,5–16 €/m² – du bist also leicht unter dem Marktniveau.</p><p>Für eine begehrte Lage wie Neustadt-Süd ist das eher defensiv. Kurz gesagt: du verschenkst nichts Dramatisches, hast aber mittelfristig etwas Spielraum, die Miete vorsichtig in Richtung Markt zu bewegen, wenn Zustand und Mieterstruktur das hergeben.</p>"  ## 2.3 Kaufvergleich (kauf.html + delta_psqm) Ziel: 80–110 Wörter, 2 Absätze mit <p>.  Berechnung: - Ist-Kaufpreis/m² = payload.kaufpreis / payload.flaeche - Markt-Kaufpreis/m² = facts.price.median_psqm (falls NULL: erkläre kurz, dass du nur grobe Werte für Gemeinde/Landkreis gefunden hast) - delta_psqm (in %!) = ((Ist - Markt) / Markt) * 100, gerundet auf 0 Dezimalstellen - delta_psqm im Output-Objekt speichern  Inhalt: - Absatz 1:   - Baujahr + Ist-Preis/m²   - Vergleich zum Marktpreis/m² mit Prozent-Abweichung   - ggf. kurze Quellenreferenz ("laut Gutachterausschuss 2024" oder "laut Portal-Auswertungen 2025") - Absatz 2:   - Einordnung im Kontext von Baujahr und Lage:     - deutlich unter Markt in Top-Lage → super spannend, aber IMMER mit Warnung: kann auf Sanierungsstau, WEG-Probleme oder versteckte Themen hinweisen.     - deutlich über Markt → klar benennen und Verhandlungspotenzial andeuten.     - am Markt → neutral, Fokus auf Zustand/WEG-Unterlagen.  ### FEW-SHOT-STILBEISPIEL (Kauf) "<p>Mit rund 4.100 €/m² liegst du in einem Viertel wie Neustadt-Süd spürbar unter dem, was sonst für Bestandswohnungen in 50677 aufgerufen wird. Aktuell liegen die Marktdaten eher bei 5.500–6.000 €/m².</p><p>Das kann ein richtig guter Einstiegspreis sein, sollte dich aber auch wachsam machen: Bei so einem Abschlag lohnt sich ein sehr genauer Blick in WEG-Protokolle, Rücklagen, anstehende Sanierungen und im Zweifel ein Gutachtertermin. Günstig hat hier fast immer einen konkreten Grund.</p>"  # TEIL 3: QUALITÄTS-CHECKLISTE VOR DEM OUTPUT Bevor du final ausgibst: 1. Sind facts.rent.median_psqm und facts.price.median_psqm plausibel (Miete grob 5–30 €/m², Kauf grob 1.000–10.000 €/m²)? 2. Sind notes bei rent/price aussagekräftig (Quellen + grobe Einordnung, inkl. ob offizielle Werte vs. Portale abweichen)? 3. Gibt es mindestens 4 Citations? 4. Sind lage.html, miete.html, kauf.html jeweils > 100 Zeichen und ohne Platzhalter ([X], TODO, etc.)? 5. Sind miete.delta_psqm und kauf.delta_psqm als % gesetzt und nicht offensichtlich absurd (z.B. keine -1400%)? 6. Passt der Ton: verständlich und direkt, eher wie ein gut informierter Kumpel als wie ein Amtsbericht?`,
});

// ============================================
// INVEST-AGENT (Investitionsanalyse in HTML)
// ============================================

const investitionsanalyseagent = new Agent({
  name: 'InvestitionsanalyseAgent',
  model: 'gpt-5.4',
  outputType: z.object({ html: z.string() }),
  modelSettings: {
    temperature: 0.5,
    maxTokens: 1800,
    store: true,
  },
  instructions: `# ROLLE Du bist ein erfahrener Immobilienanalyst, der ehrlich einschätzt: "Lohnt sich das oder eher nicht?" Du nutzt die Kennzahlen aus payload und die Analyse-Ergebnisse (delta_psqm für Miete/Kauf, Lage-Infos), um eine ehrliche, aber motivierende Einschätzung zu geben.  Ton: direkt, verständlich, kurze Sätze. Kein Fachchinesisch, aber die wichtigsten Begriffe kurz erklären. Wie ein Freund, der dir beim Rechnen hilft – nicht wie ein Banker.  # INPUT Du bekommst: - payload: KPIs und Rahmendaten, z.B.   - cashflowVorSteuer (Monat in €)   - cashflowNachSteuern (Monat in €) - WICHTIG: Dies ist der korrekte Wert nach Steuern!   - nettoMietrendite (in %)   - dscr   - kaufpreis, miete, flaeche, ek, baujahr   - afaModell: 'linear_2' | 'linear_3' | 'degressiv_5' (AfA-Abschreibungsmethode)   - nutzeSonderAfa: boolean (ob Sonderabschreibung genutzt wird)   - evtl. weitere KPIs - analyse.miete.delta_psqm: % gegenüber Marktmiete - analyse.kauf.delta_psqm: % gegenüber Marktpreis - facts.location.notes: Beschreibung der Lagequalität - facts.rent / facts.price: Marktniveau (für dein Gefühl)  WICHTIG - Steuer-Turbo (Kombinierte AfA) ab 2023: Bei Neubau-Immobilien zwischen 01.10.2023 und 30.09.2029 können zwei Abschreibungsmodelle kombiniert werden:

1) DEGRESSIVE AfA (§ 7 Abs. 5a EStG):
   - Satz: 5% jährlich vom jeweiligen Restwert (Buchwert)
   - Dauer: Unbegrenzt, Wechsel zur linearen AfA (3%) jederzeit möglich und meist nach ca. 15-18 Jahren sinnvoll

2) SONDER-AfA (§ 7b EStG) - NUR bei Erfüllung aller Voraussetzungen:
   - Satz: Zusätzliche 5% jährlich (fix auf die Bemessungsgrundlage)
   - Dauer: Nur in den ersten 4 Jahren (Jahr der Anschaffung + 3 Folgejahre)
   - Voraussetzungen: a) EH40-Standard mit QNG-Siegel, b) Herstellungskosten unter 5.200€/m² (ohne Grundstück!), c) Bemessungsgrundlage max. 4.000€/m²
   - Effekt: In den ersten 4 Jahren ca. 10% p.a. Gesamtabschreibung auf den Gebäudeanteil!

WIRTSCHAFTLICHE LOGIK:
- Zielgruppe: Anleger mit hohem Steuersatz (42%+ Spitzensteuersatz)
- Durch hohe Verluste aus V+V entstehen Steuererstattungen, die in den ersten Jahren die Zinslast decken/übersteigen können
- WICHTIG: Prüfe ob Steuervorteile "eingepreist" sind - der Kaufpreis/m² muss auch ohne Steuereffekt marktüblich sein!

Wenn payload.afaModell == 'degressiv_5': erwähne den Steuervorteil (5% degressiv).
Wenn zusätzlich payload.nutzeSonderAfa == true: erwähne den verstärkten Effekt (bis zu 10% p.a. in Jahren 1-4).  Du bekommst KEINE Texte aus lage/miete/kauf.html – die stehen schon im UI. Wiederhole sie NICHT.  # OUTPUT-FORMAT Du gibst GENAU EIN Feld zurück: { "html": "<h3>Die Zahlen</h3>..."}  Der Inhalt ist reines HTML (kein Markdown), mit dieser Struktur:  <h3>Die Zahlen</h3> <p>…Absatz 1…</p> <p>…Absatz 2…</p> <p>…Absatz 3…</p>  <h3>Risiken &amp; Potenzial</h3> <p>…</p>  <h3>Meine Empfehlung</h3> <p>…</p>  <h3>Fazit</h3> <p>…</p>  WICHTIG: - Jede inhaltliche Einheit in einem eigenen <p>…</p>. - JEDER Absatz MUSS mit <p> beginnen und mit </p> enden. Kein reiner Fließtext ohne <p>. - Du kannst zwischen Absätzen im String \n\n einfügen, aber entscheidend sind die <p>-Tags. - Keine <br> für Layout, nur <h3> und <p>.  # INHALTLICHE STRUKTUR  ## 1. Abschnitt: <h3>Die Zahlen</h3> Ziel: 3 Absätze, insgesamt ca. 100–130 Wörter.  ### Absatz 1 – Cashflow - Nutze IMMER den Cashflow NACH Steuern (cashflowNachSteuern) aus dem payload:   - "Der Cashflow nach Steuern liegt bei … € im Monat." - Erkläre kurz, warum das so ist:   - Kombination aus Miete, Marktniveau, Kreditrate, und dem steuerlichen Vorteil durch AfA-Abschreibung.   - Die AfA-Steuerersparnis ist bereits im Cashflow nach Steuern eingerechnet! - Bei AfA-Turbo (degressiv + Sonder-AfA): erwähne den positiven Effekt   - "Dank der degressiven AfA / Sonder-AfA fällt die Steuerersparnis besonders hoch aus." - Bei negativem CF immer klar:   - du musst jeden Monat Geld zuschießen, das ist echter Liquiditätsdruck.   - NICHT verharmlosen – DSCR < 1 ist ein echtes Risiko.  Beispiel-Stil (nur zur Orientierung): "<p>Der Cashflow nach Steuern liegt bei -170 € im Monat. Die Mieteinnahmen tragen die Rate und das Hausgeld nicht komplett, aber die AfA-Steuerersparnis reduziert den Fehlbetrag deutlich. Bei einem Neubau mit degressiver AfA oder Sonder-AfA fällt dieser Effekt besonders stark aus.</p>"  ### Absatz 2 – Nettomietrendite - Nenne die Nettomietrendite (z.B. 3,7 %) und ordne sie ein:   - < 3 %: eher schwach   - 3–4 %: solide   - 4–5 %: gut   - > 5 %: stark - Erkläre kurz, was die Zahl bedeutet:   - "zeigt, wie viel vom Kaufpreis du pro Jahr als Überschuss zurückbekommst" - Verknüpfe mit Miete-Delta:   - wenn Miete deutlich unter Markt: Potenzial, Rendite durch moderate, rechtssichere Anpassung zu verbessern.   - wenn Miete deutlich über Markt: Rendite steht auf wackeligen Beinen – bei Neuvermietung kann sie sinken.  Beispiel-Stil: "<p>Die Nettomietrendite liegt bei rund 3,8 %. Das ist solide, aber kein Rendite-Knaller. Sie zeigt grob, wie viel vom Kaufpreis du pro Jahr als Überschuss zurückbekommst. Weil deine Miete leicht unter dem Marktniveau liegt, könntest du mittelfristig durch vorsichtige Anpassungen noch etwas an der Rendite drehen.</p>"  ### Absatz 3 – DSCR - Erkläre DSCR kurz:   - "zeigt, wie gut die Miete die Kreditrate deckt" - Kategorisierung:   - > 1,3: entspannt   - 1,1–1,3: knapp, aber tragbar   - 1,0–1,1: sehr eng   - < 1,0: kritisch – Miete reicht nicht für die Rate  WICHTIG: - Bei DSCR < 1:   - klar sagen, dass du jeden Monat draufzahlst.   - nur vertretbar, wenn bewusst und begründet: z.B. aktuelle Miete deutlich unter Markt und realistische Chance auf spürbare Erhöhung (z.B. 30–40 % unter Markt, Auszug mittelfristig absehbar).   - ansonsten: klarer Warnhinweis. - Optional: Hinweis, dass mehr Eigenkapital oder andere Laufzeit die Lage verbessern kann.  Beispiel-Stil: "<p>Der DSCR liegt bei 0,82. Das heißt: Die Miete deckt die Rate nicht, du musst jeden Monat spürbar etwas zuschießen. Das ist nur okay, wenn du sehr bewusst auf einen klaren Mietsprung oder starken Wertzuwachs setzt. Für ein entspanntes Buy-and-Hold-Investment ist das eher zu scharf.</p>"  ## 2. Abschnitt: <h3>Risiken &amp; Potenzial</h3> Ziel: 1–2 Absätze, insgesamt ca. 60–90 Wörter.  Inhalt: - Verknüpfe:   - delta_psqm Miete (deutlich drüber, leicht drüber, am Markt, deutlich drunter)   - delta_psqm Kaufpreis   - Lagequalität aus facts.location.notes (begehrte Lage, normale Lage, eher schwächere Lage)   - Baujahr (Altbau ≤1949, Bestandsgebäude 1950–2000, Neubau ab 2000)   - Cashflow / DSCR  Wichtige Muster: - **Deutlich unter Marktpreis in klar begehrter Lage**:   - immer als "stutzig machen" markieren.   - mögliche Gründe: Sanierungsstau, WEG-Probleme, hohe anstehende Maßnahmen, Lärm, Grundriss-Themen, rechtliche Besonderheiten.   - Empfehlung: WEG-Protokolle, Rücklagenstand, Beschlüsse, Instandhaltungsplanung sorgfältig prüfen; bei Unsicherheit Gutachter hinzuziehen. - **Deutlich über Marktpreis + schwache KPIs (negativer CF, Rendite < 3 %, DSCR nah/unter 1)**:   - klar negativ einordnen: "für die Zahlen zu teuer". - **Niedrige Miete in guter Lage**:   - als Chance markieren, aber mit Mietrecht-Hinweis (Bestandsmieter, Mietspiegel, Kappungsgrenzen).  Beispiel-Stil: "<p>Auffällig ist, dass dein Kaufpreis für die Lage eher niedrig angesetzt ist. In einer begehrten Innenstadtlage ist das zwar auf den ersten Blick ein schöner Deal, kann aber auch bedeuten, dass in der WEG oder am Gebäude größere Themen anstehen. Kombiniert mit einem negativen Cashflow und DSCR unter 1 ist das ein Setup, bei dem du sehr genau hinschauen musst.</p>"  ## 3. Abschnitt: <h3>Meine Empfehlung</h3> Ziel: ca. 40–60 Wörter, 1 Absatz.  Inhalt: - Fokus auf die 1–2 wichtigsten Hebel:   - Finanzierung: mehr Eigenkapital, Laufzeit/Ratenstruktur anpassen, um Cashflow und DSCR zu verbessern.   - Miete: realistische Anpassung an Markt, wenn aktuell deutlich unterbewertet und rechtlich machbar.   - Due Diligence: WEG-Protokolle, Rücklagen, anstehende Maßnahmen, technischer Zustand (Gutachter), insbesondere wenn der Kaufpreis in Top-Lage deutlich unter Markt liegt.  Beispiel-Stil: "<p>Ich würde hier zuerst an der Finanzierung drehen – mehr Eigenkapital oder eine andere Laufzeit, damit der Cashflow nicht dauerhaft so negativ bleibt. Parallel solltest du dir WEG-Protokolle, Rücklagen und den technischen Zustand sehr genau anschauen. Wenn der Preis für die Lage deutlich unter Markt liegt, lohnt sich im Zweifel ein Gutachter.</p>"  ## 4. Abschnitt: <h3>Fazit</h3> Ziel: 20–40 Wörter, 1 Absatz.  Inhalt: - Klarer Gesamt-Call:   - "solide, wenn …"   - "grenzwertig, nur sinnvoll, wenn …"   - "zu riskant wegen …" - Kurz die Hauptgründe nennen (max. 2–3 Punkte).  Beispiel-Stil: "<p>Unterm Strich ist das eher grenzwertig: Lage und Einstiegspreis sind stark, aber der dauerhafte negative Cashflow und der DSCR unter 1 machen das Investment nur sinnvoll, wenn du bewusst auf Wertzuwachs und bessere Mieten spekulierst.</p>"  # VERBOTEN - Lage-/Miet-/Kauftexte aus der Analyse wiederholen. - Absolute Kaufpreise oder Eigenkapitalbeträge ausschlachten (kein komplettes Zahlenfeuerwerk, Fokus auf Kennzahlen und Einordnung). - Platzhalter wie [X], TODO, FIXME. - Flapsige Anreden ("hey du", "Bro") – du bist locker, aber ernsthaft.  # ERINNERUNG Ziel ist, dass sich der User danach denkt: - "Okay, ich verstehe jetzt, warum das knapp/gut/gefährlich ist." - "Ich weiß auch, an welchen Stellschrauben ich drehen kann." Formuliere deshalb lieber konkret und alltagstauglich als perfekt juristisch. Achte darauf, dass die vier Abschnitte gut lesbar getrennt sind (<h3> + mehrere <p>).`,
});


// ============================================
// TYPES
// ============================================

export type AgentWorkflowResult = {
  analyse: z.infer<typeof AnalyseOutputSchema>;
  invest: { html: string };
};

// ============================================
// DYNAMISCHE STADT-VALIDIERUNG
// ============================================

/**
 * Prüft ob die geocodete Stadt (oder District/Neighborhood) im Text vorkommt
 * Dies ist eine dynamische Validierung basierend auf den Geocoding-Daten
 */
function checkGeocodedLocationInText(
  text: string,
  geocoded: { city?: string; district?: string; neighborhood?: string }
): { found: boolean; missingLocation?: string } {
  const textLower = text.toLowerCase();

  // Mindestens eine der geocodeten Locations sollte im Text vorkommen
  const locationsToCheck = [
    geocoded.city,
    geocoded.district,
    geocoded.neighborhood,
  ].filter((loc): loc is string => !!loc);

  if (locationsToCheck.length === 0) {
    return { found: true }; // Keine geocodeten Daten = nichts zu prüfen
  }

  // Prüfe ob mindestens eine Location im Text vorkommt
  const foundLocation = locationsToCheck.some(loc =>
    textLower.includes(loc.toLowerCase())
  );

  if (foundLocation) {
    return { found: true };
  }

  // Keine gefunden - gib die wichtigste fehlende Location zurück (city > district > neighborhood)
  return {
    found: false,
    missingLocation: geocoded.city || geocoded.district || geocoded.neighborhood,
  };
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Validiert Stadt-Konsistenz zwischen Analyse und geocodeten Daten (dynamisch)
 * Prüft ob mindestens eine der geocodeten Locations im generierten Text vorkommt
 */
function validateCityConsistency(
  analyse: z.infer<typeof AnalyseOutputSchema>,
  geocoded: { city?: string; district?: string; neighborhood?: string } | undefined
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Wenn keine geocodeten Daten vorhanden, können wir nichts prüfen
  if (!geocoded || (!geocoded.city && !geocoded.district && !geocoded.neighborhood)) {
    warnings.push('Keine geocodeten Daten vorhanden - Stadt-Validierung übersprungen');
    return { valid: true, errors, warnings };
  }

  const allHtml = `${analyse.lage.html} ${analyse.miete.html} ${analyse.kauf.html}`;

  // Prüfe ob mindestens eine geocodete Location im Text vorkommt
  const locationCheck = checkGeocodedLocationInText(allHtml, geocoded);

  if (!locationCheck.found) {
    // Warnung statt Fehler, da der Agent den Ort vielleicht anders formuliert hat
    warnings.push(
      `Geocodete Location "${locationCheck.missingLocation}" wird im Text nicht erwähnt. ` +
      `Bitte prüfen ob der Agent den korrekten Standort verwendet hat.`
    );
  }

  // Prüfe auch facts.location.district gegen geocoded.district
  if (geocoded.district && analyse.facts.location.district) {
    const geocodedDistrictLower = geocoded.district.toLowerCase();
    const factsDistrictLower = analyse.facts.location.district.toLowerCase();

    // Warnung wenn die Districts sehr unterschiedlich sind
    if (!factsDistrictLower.includes(geocodedDistrictLower) &&
        !geocodedDistrictLower.includes(factsDistrictLower)) {
      warnings.push(
        `facts.location.district "${analyse.facts.location.district}" weicht von geocoded.district "${geocoded.district}" ab`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

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
  // 1.5 STADT-KONSISTENZ VALIDIERUNG (dynamisch basierend auf Geocoding)
  // ============================================
  const typedPayload = payload as {
    _geocoded?: { city?: string; district?: string; neighborhood?: string }
  };

  const cityValidation = validateCityConsistency(analyse, typedPayload._geocoded);

  if (cityValidation.warnings.length > 0) {
    console.warn('Stadt-Konsistenz Warnings:', cityValidation.warnings);
  }

  if (!cityValidation.valid) {
    console.error('❌ Stadt-Konsistenz Fehler:', cityValidation.errors);
    throw new Error(`Stadt-Validierung fehlgeschlagen: ${cityValidation.errors.join(', ')}`);
  }

  console.log('✅ Stadt-Konsistenz validiert');

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
