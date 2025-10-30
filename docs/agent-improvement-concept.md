# Agent Output Verbesserung: Marktvergleich & Lage

## Executive Summary

Die aktuellen Agent-Outputs für Marktvergleich und Lageanalyse sind zu schwach. Hauptprobleme:
- **Zu kurz**: 2-3 Sätze für komplexe Marktanalysen
- **Zu schwaches Modell**: gpt-4o-mini für alle Analysen
- **Fragmentierte Architektur**: Research + Writer getrennt, keine Möglichkeit zum Nachrecherchieren
- **Starres Format**: Kein Raum für nuancierte Analysen

## 1. Was erwarten Nutzer:innen? (Research-Findings)

### Marktanalyse
✅ **Erwartungen:**
- Detaillierte Vergleichswerte mit ähnlichen Objekten (nicht nur Median)
- Markttrends und Preisentwicklung
- Segment-spezifische Analysen (3Z Altbau vs. 4Z Neubau)
- Begründete Handlungsempfehlungen
- Transparenz über Datenquellen

❌ **Aktuelle Realität:**
```
"Die 3-Zimmer-Wohnung (67 m²) wird für 14,93 €/m² vermietet.
In Wettenberg liegt der Schnitt bei 10,34 €/m². Du liegst also 44% drüber."
```
→ Keine Erklärung WARUM, keine Markttrends, keine Nachfrage-Kontext

### Lageanalyse
✅ **Erwartungen:**
- Makro-Lage (Stadt, Region, Wirtschaftsraum)
- Mikro-Lage (Viertel, Straßenzug, Infrastruktur)
- Nachfragetreiber mit Begründung
- Entwicklungspotenzial
- Risikofaktoren

❌ **Aktuelle Realität:**
```
"Der Markt ist überschaubar mit tendenziell stabileren Mietern.
Konkrete Leerstandszahlen für Wettenberg liegen nicht vor.
Zur Vermietungsdauer gibt es keine belastbaren Daten."
```
→ Zu vage, zu defensiv, keine Substanz

## 2. Probleme der aktuellen Architektur

### Problem 1: Research-Writer-Split verhindert tiefe Analyse

**Aktueller Flow:**
```
Research Agent (gpt-4o-mini)
    ↓ [ResearchSchema - strukturierte Daten]
Writer Agents (gpt-4o-mini)
    ↓ [2-3 Sätze]
```

**Probleme:**
- Writer kann NICHT nachrecherchieren
- Writer bekommt nur strukturierte Fakten, keinen Kontext
- Wenn Research etwas übersieht → Writer kann es nicht ausgleichen
- Keine Möglichkeit für Chain-of-Thought Reasoning

### Problem 2: gpt-4o-mini für alles

**Forschung zeigt:**
- gpt-4o-mini: Gut für strukturierte Outputs, SCHWACH für tiefe Analysen
- Reasoning Models (o1, o3): Besser für komplexe Investment-Entscheidungen
- GPT-4o: Deutlich stärker für nuancierte Texte

**Aktuelle Kosten:**
- Research: gpt-4o-mini (niedrig)
- LageAgent: gpt-4o-mini (niedrig)
- MietAgent: gpt-4o-mini (niedrig)
- KaufAgent: gpt-4o-mini (niedrig)
→ **Total: 4x mini-calls = billig, aber schwach**

### Problem 3: Zu rigide Format-Vorgaben

**Aktuelle Prompts:**
```
# DEIN OUTPUT: 2-3 SÄTZE FLIESSTEXT

Satz 1 - Die Fakten
Satz 2 - Der Marktvergleich
Satz 3 - Die Bewertung
```

→ Kein Raum für:
- Kontextualisierung
- Nuancen
- Mehrere Aspekte gleichzeitig
- Qualitative Bewertung

### Problem 4: Fehlende Reasoning-Fähigkeit

**Beispiel:**
- Miete 44% über Markt
- Lage: Kleinstadt Wettenberg
- Baujahr: 1900 (Altbau)

**Was fehlt:**
- WARUM so teuer? (Sanierung? Lage? Überteuert?)
- IST das realistisch? (Comparable sales?)
- WAS bedeutet das? (Risiko? Chance?)

→ Aktuell: Nur Fakten, keine Interpretation

## 3. Lösungsansätze: Drei Optionen

### Option A: Ein Mega-Agent (Research + Analyse + Writing)

**Konzept:**
```
Ein Agent macht ALLES:
1. Recherchiert Marktdaten
2. Analysiert die Lage
3. Schreibt beide Analysen
```

**Vorteile:**
- ✅ Kann iterativ nachrecherchieren
- ✅ Kohärente Gesamtsicht
- ✅ Kein Kontext-Verlust

**Nachteile:**
- ❌ Sehr lange Laufzeit (seriell)
- ❌ Riesiger Prompt (komplex)
- ❌ Schwer zu debuggen
- ❌ Teuer wenn o1/o3

**Modell:** gpt-4o oder o1-mini
**Kosten:** Hoch (ein großer Call)

---

### Option B: Separate Research + Writer Agents (MIT eigenem Research)

**Konzept:**
```
Research Agent (global)
    ↓
    ├─→ Lage-Agent (kann nachrecherchieren)
    └─→ Markt-Agent (kann nachrecherchieren)
```

**Wie:**
- Research macht Basis-Recherche
- Lage-Agent bekommt Research + kann SELBST web_search nutzen
- Markt-Agent bekommt Research + kann SELBST web_search nutzen

**Vorteile:**
- ✅ Parallel ausführbar (schnell)
- ✅ Spezialisierte Agents
- ✅ Flexibel nachrecherchierbar
- ✅ Einfach zu debuggen

**Nachteile:**
- ❌ Potenzielle Doppelung von Research
- ❌ Mehr API-Calls

**Modelle:**
- Research: gpt-4o-mini (strukturiert)
- Lage-Agent: gpt-4o (reasoning + schreiben)
- Markt-Agent: gpt-4o (reasoning + schreiben)

**Kosten:** Mittel (3 calls, aber 2x gpt-4o)

---

### Option C: Research + Reasoning + Writing (3-Stufen)

**Konzept:**
```
Research Agent (gpt-4o-mini)
    ↓
Reasoning Agent (o1-mini) - Analysiert Daten, plant Output
    ↓
Writer Agent (gpt-4o) - Schreibt basiert auf Reasoning
```

**Vorteile:**
- ✅ Beste Qualität (Reasoning-Model)
- ✅ Klare Trennung: Daten → Denken → Schreiben
- ✅ Günstig (o1-mini < o1)

**Nachteile:**
- ❌ Komplex
- ❌ Langsam (seriell)
- ❌ Kein Nach-Recherchieren möglich

**Modelle:**
- Research: gpt-4o-mini
- Reasoning: o1-mini
- Writer: gpt-4o

**Kosten:** Mittel-Hoch

---

## 4. Empfehlung: Option B+ (Hybrid)

**Warum Option B+?**
- ✅ Beste Balance: Qualität, Speed, Kosten
- ✅ Flexibel: Agents können nachrecherchieren
- ✅ Parallel: Schnelle Ausführung
- ✅ Einfach: Klare Verantwortlichkeiten

**Konkrete Architektur:**

```
Research Agent (gpt-4o-mini)
├─ Recherchiert: Mietmedian, Kaufpreismedian, Leerstand, Nachfrage
├─ Output: ResearchSchema (strukturiert)
└─ Tools: web_search, citations

        ↓ [parallel]

┌──────────────────────────────────┬──────────────────────────────────┐
│ Lage-Agent (gpt-4o)              │ Markt-Agent (gpt-4o)             │
├──────────────────────────────────┼──────────────────────────────────┤
│ Input:                           │ Input:                           │
│  - payload (Objektdaten)         │  - payload (Objektdaten)         │
│  - facts (Research-Ergebnisse)   │  - facts (Research-Ergebnisse)   │
│                                  │                                  │
│ Tools:                           │ Tools:                           │
│  - web_search (optional)         │  - web_search (optional)         │
│                                  │                                  │
│ Output: 150-200 Wörter           │ Output: 2 Abschnitte:            │
│  - Makro-Lage                    │   1. Mietvergleich (80-100 W)    │
│  - Mikro-Lage                    │   2. Kaufvergleich (80-100 W)    │
│  - Nachfragetreiber              │                                  │
│  - Leerstand & Vermietbarkeit    │  Jeweils:                        │
│  - Entwicklungspotenzial         │   - Fakten                       │
│                                  │   - Marktvergleich               │
│                                  │   - Reasoning                    │
│                                  │   - Handlungsempfehlung          │
└──────────────────────────────────┴──────────────────────────────────┘
```

**Modellwahl:**
- **Research**: `gpt-4o-mini` (gut für strukturierte Daten, günstig)
- **Lage-Agent**: `gpt-4o` (braucht Reasoning für Kontext)
- **Markt-Agent**: `gpt-4o` (braucht Reasoning für Vergleiche)
- **Invest-Agent**: `o1-mini` (komplexe Investment-Entscheidung)

**Kosten-Vergleich:**

| Setup | Calls | Kosten (geschätzt) |
|-------|-------|-------------------|
| **Aktuell** | 4x mini | ~$0.02 |
| **Option B+** | 1x mini + 2x 4o | ~$0.15 |
| **Option A (o1)** | 1x o1 | ~$0.30 |

→ **7.5x teurer, aber 10x bessere Qualität**

## 5. Konkrete Umsetzung

### 5.1 Neuer Lage-Agent (gpt-4o)

**Prompt-Struktur:**

```markdown
# ROLLE
Du bist ein Immobilien-Analyst und bewertest die Lage für Investoren.
Ziel: Fundierte, ehrliche Einschätzung mit allen relevanten Faktoren.

# INPUT
- payload: Objektdaten (Adresse, Typ, Größe, etc.)
- facts: Research-Ergebnisse (Marktdaten, Leerstand, Nachfrage)

# DEIN OUTPUT: 150-200 WÖRTER (4-5 Absätze)

## Struktur:

### 1. Makro-Lage (30-40 Wörter)
- Region, Stadt, Wirtschaftsraum
- Verkehrsanbindung (falls in facts)
- Wirtschaftliche Entwicklung

### 2. Mikro-Lage (30-40 Wörter)
- Viertel/Stadtteil
- Infrastruktur (Einkaufen, Schulen, ÖPNV)
- Wohnqualität

### 3. Nachfrage & Zielgruppen (40-50 Wörter)
- WER mietet hier? (aus facts.demand.drivers - nur wenn KONKRET)
- WARUM? (Uni, Pendler, Familien - mit Begründung)
- Nachfrage-Stabilität

### 4. Leerstand & Vermietungsrisiko (30-40 Wörter)
- Leerstandsquote (falls verfügbar)
- Risiko-Einschätzung
- Erwartete Vermietungsdauer (nur wenn Daten vorliegen)

### 5. Entwicklungspotenzial (20-30 Wörter)
- Trends (Aufwertung, Stabilität, Risiko)
- Langfristige Perspektive

# REASONING
Bevor du schreibst, DENKE:
1. Was sind die STÄRKEN der Lage?
2. Was sind die SCHWÄCHEN?
3. Was bedeutet das für einen INVESTOR?

# TONFALL
Sachlich, ehrlich, fundiert. Keine Marketing-Sprache.
Bei unsicheren Daten: klar kommunizieren.

# TOOLS
- web_search: Nutze bei Bedarf für zusätzliche Infos (z.B. geplante Infrastruktur)
```

**Beispiel Output:**

```
Wettenberg liegt im Speckgürtel von Gießen, etwa 5 km nördlich der
Universitätsstadt. Die Anbindung ist gut: A485 und Regionalbusse
verbinden mit Gießen in 15 Minuten. Die Region profitiert von der
Uni Gießen und hat stabile Arbeitsmarktdaten.

Die Lage in Wettenberg-Mitte ist solide Wohnlage mit guter Infrastruktur
(Einkaufen, Schulen, Ärzte fußläufig). Das Viertel ist ruhig und
familienfreundlich, jedoch ohne besondere Highlights.

Die Nachfrage wird primär von Pendlern nach Gießen/Frankfurt und
Studierenden getrieben, die günstigere Mieten als in Gießen suchen.
Die Uni-Nähe (3 km) stabilisiert die Nachfrage ganzjährig. Familien
sind aufgrund der Schulen ebenfalls eine relevante Zielgruppe.

Konkrete Leerstandsdaten für Wettenberg liegen nicht vor. Die Region
Gießen hat eine Quote von etwa 2,5%, was auf niedriges Risiko hindeutet.
Vermietung sollte innerhalb von 4-8 Wochen machbar sein, insbesondere
zum Semesterstart.

Langfristig stabil, aber keine Aufwertung zu erwarten. Die Lage ist
"verlässlich" - weder Hot Spot noch Problemzone.
```

---

### 5.2 Neuer Markt-Agent (gpt-4o)

**Struktur:**

```markdown
# ROLLE
Du vergleichst Miete UND Kaufpreis mit dem Markt - fundiert und ehrlich.

# INPUT
- payload: Objektdaten (Miete, Kaufpreis, Fläche, Zimmer, Baujahr)
- facts: Research-Ergebnisse (rent, price mit Median und Range)

# DEIN OUTPUT: 2 Abschnitte (je 80-100 Wörter)

## ABSCHNITT 1: Mietvergleich

### Struktur:
1. **Fakten** (20W): Aktuelle Miete, €/m², Objektdaten
2. **Marktvergleich** (30W): Median, Segment-Median (falls relevant), Range
3. **Reasoning** (30W): WARUM liegt die Miete drüber/drunter?
   - Ausstattung? Lage? Zustand? Baujahr?
4. **Handlungsempfehlung** (20W): Was bedeutet das für den Investor?

## ABSCHNITT 2: Kaufpreisvergleich

### Struktur:
1. **Fakten** (20W): Kaufpreis, €/m², Objektdaten
2. **Marktvergleich** (30W): Median, Segment-Median, Range
3. **Reasoning** (30W): WARUM liegt der Preis drüber/drunter?
4. **Handlungsempfehlung** (20W): Verhandlung, WEG-Prüfung, etc.

# WICHTIG
- Nutze Segment-Median NUR wenn >5% Unterschied zum Gesamt-Median
- Erkläre WARUM Abweichungen existieren (nicht nur DASS)
- Keine Zahlen erfinden - bei Unsicherheit: web_search nutzen

# TOOLS
- web_search: Für zusätzliche Vergleichsobjekte oder Markttrends
```

**Beispiel Output - Mietvergleich:**

```
Die 3-Zimmer-Wohnung (67 m², Altbau) wird aktuell für 1.000 € kalt
vermietet, das entspricht 14,93 €/m².

In Wettenberg liegt der Mietmedian bei 10,34 €/m². Für vergleichbare
3-Zimmer-Wohnungen (60-80 m²) liegt der Segment-Median bei 11,20 €/m²,
die übliche Spanne reicht von 10,00 bis 12,50 €/m². Du liegst mit
14,93 €/m² also 44% über dem Markt bzw. 33% über dem Segment-Median.

Diese deutliche Abweichung lässt sich nur durch außergewöhnliche
Faktoren rechtfertigen: hochwertige Sanierung, Premium-Ausstattung
(z.B. Echtholzparkett, moderne Einbauküche, Balkon) oder eine
exzellente Mikrolage (z.B. Toplage mit Weitblick). Falls diese
Faktoren nicht zutreffen, ist die Miete überzogen und bei
Neuvermietung schwer durchsetzbar.

Risiko: Bei Mieterwechsel musst du vermutlich auf 11-12 €/m²
runtergehen (-20% = 800-840 € kalt). Das bedeutet 160-200 € weniger
Cashflow pro Monat. Prüfe die Ausstattung kritisch und kalkuliere
konservativ mit Marktmiete.
```

---

### 5.3 Neue Invest-Agent (o1-mini)

**Warum o1-mini?**
- Komplexe Investment-Entscheidung braucht Reasoning
- Muss alle Faktoren abwägen: Lage, Miete, Kaufpreis, Cashflow, Risiken
- o1-mini: besseres Kosten/Nutzen als o1

**Prompt bleibt ähnlich, aber:**
- Mehr Raum für Reasoning
- Explizite "Think-Step-by-Step" Anweisungen
- Größerer Kontext (alle vorherigen Analysen)

---

## 6. Implementation Timeline

### Phase 1: Markt-Agent verbessern (Prio 1)
**Warum zuerst?**
- Direkteste Impact auf Nutzer
- Einfacher zu testen
- Weniger abhängig von anderen Agents

**Tasks:**
1. Neuen `MarktAgent` erstellen (gpt-4o)
2. Prompt umschreiben (siehe 5.2)
3. Output-Länge erhöhen (160-200W total)
4. web_search-Tool aktivieren
5. A/B Testing mit 5 Test-Objekten

**Timeline:** 1-2 Tage

---

### Phase 2: Lage-Agent verbessern (Prio 2)
**Tasks:**
1. Neuen `LageAgent` erstellen (gpt-4o)
2. Prompt umschreiben (siehe 5.1)
3. Output-Länge erhöhen (150-200W)
4. web_search-Tool aktivieren
5. A/B Testing

**Timeline:** 1-2 Tage

---

### Phase 3: Invest-Agent auf o1-mini (Prio 3)
**Tasks:**
1. Invest-Agent auf o1-mini umstellen
2. Prompt für Reasoning optimieren
3. Längere Outputs (300-400W)
4. Testing

**Timeline:** 1 Tag

---

### Phase 4: Research-Agent verbessern (Optional)
**Mögliche Verbesserungen:**
- Mehr Citations
- Tiefere Segment-Analysen
- Historische Daten (Preisentwicklung)

**Timeline:** 2-3 Tage

---

## 7. Erfolgsmetriken

**Qualitative Metriken:**
- [ ] Output-Länge: 150-200W für Lage, 160-200W für Markt
- [ ] Reasoning vorhanden (nicht nur Fakten)
- [ ] Handlungsempfehlungen fundiert
- [ ] Keine erfundenen Daten

**Quantitative Metriken:**
- [ ] User Feedback: "War das hilfreich?" (Target: >80%)
- [ ] Time-on-Page für Analyse-Sektion (+20% = besser)
- [ ] Conversion: "Jetzt kaufen" vs. "Weiteres Objekt" (mehr Engagement)

**Kosten:**
- Aktuell: ~$0.02 pro Analyse
- Neu: ~$0.15 pro Analyse (+650%)
- **ROI:** Wenn 1 von 10 Nutzern dadurch konvertiert → lohnt sich

---

## 8. Risiken & Mitigation

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| **Zu langsam** (gpt-4o langsamer als mini) | Mittel | Parallel-Execution, Caching |
| **Zu teuer** (7.5x teurer) | Hoch | Pricing anpassen, Premium-Tier |
| **Halluzinationen** (mehr Freitext = mehr Risiko) | Hoch | Validierung, Citations, Fact-Check |
| **Zu lang** (User lesen nicht alles) | Mittel | Gute Struktur, Absätze, Highlights |
| **Inkonsistenz** (verschiedene Modelle) | Niedrig | Klare Prompts, Testing |

---

## 9. Nächste Schritte

1. **Review dieses Konzepts** - Feedback einholen
2. **Entscheidung**: Option B+ umsetzen?
3. **Priorisierung**: Markt-Agent zuerst?
4. **Prototyping**: 1 Agent umbauen und testen
5. **Rollout**: Stufenweise (A/B Testing)

---

## Anhang: Konkrete Prompt-Beispiele

Siehe separates Dokument: `agent-prompts-v2.md`
