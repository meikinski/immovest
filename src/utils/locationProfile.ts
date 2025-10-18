// src/utils/locationProfile.ts

export type Morphologie = 'innerstädtisch' | 'stadtnah' | 'randnah' | 'ländlich';

export interface LocationObjectInfo {
  baujahr?: number;
  typ?: string;
  zimmer?: number;
  flaeche?: number;
}

export interface Snippet {
  title?: string;
  text: string;
}

export interface LocationProfileInput {
  address: string;
  object?: LocationObjectInfo;
  snippets?: Array<Snippet | string>;
  compact?: boolean;
  morph?: Morphologie | null;
}

export interface VacancySignal {
  ratePct?: number;
  qualifier?: 'hoch' | 'mittel' | 'niedrig' | 'ueberdurchschnittlich' | 'unterdurchschnittlich';
  raw?: string;
  hasExplicit?: boolean;
}

/* ---------------------------- Snippet Utils ---------------------------- */

function normalizeSnippets(snippets?: Array<Snippet | string>): Snippet[] {
  if (!snippets) return [];
  return snippets
    .map((s) => (typeof s === 'string' ? { text: s } : s))
    .filter((s) => typeof s.text === 'string' && s.text.trim().length > 0);
}

/** Baut einen „Belege“-Block: kurze, wörtliche Zeilen mit hohem POI/ÖPNV-Signal */
function buildEvidenceLines(
  snippets: Array<Snippet | string> | undefined,
  maxItems = 6,
  maxChars = 700
): string[] {
  const list = normalizeSnippets(snippets);
  if (!list.length) return [];

  const raw = list
    .map((s) => (s.title ? `${s.title}: ${s.text}` : s.text))
    .join('\n')
    // harte Trennungen, aber Original-Groß/Kleinschreibung behalten
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Score je Zeile: POI-/Transit-/Toponym-Signale
  const patterns: Array<{ re: RegExp; w: number }> = [
    { re: /\bbarbarossaplatz|rudolfplatz|neumarkt|zoologischer\s?garten|hansaring\b/i, w: 6 },
    { re: /\b(friesenplatz|ehrens[dt]ra[ßs]e|aachener\s?stra[ßs]e|hohenzollernring|luxemburger\s?stra[ßs]e|gürtel|allee|ring)\b/i, w: 5 },
    { re: /\b(hauptbahnhof|hbf|bahnhof|u-?bahnhof|s-?bahnhof)\b/i, w: 5 },
    { re: /\b(u|s)-?bahn\s?linie[n]?\s?\d+/i, w: 4 },
    { re: /\buni(versit[aä]t)?|hochschule|campus|messe|klinikum\b/i, w: 3 },
    { re: /\b(innenstadt|zentral|stadtnah|randlage|l[aä]ndlich|pendel[nr]?|öpnv|anbindung)\b/i, w: 2 },
  ];

  type Scored = { line: string; score: number; key: string };
  const seen = new Set<string>();
  const scored: Scored[] = raw.map((line) => {
    const key = line.toLowerCase();
    let score = 0;
    for (const { re, w } of patterns) if (re.test(line)) score += w;
    // leichtes Bonusgewicht für Zeilen mit Zahlen/Prozent (z. B. Linien, Entfernung, %)
    if (/\b\d{1,2}(\.\d+)?\s?%|\b\d+\s?(min|meter|m|km|linien?)\b/i.test(line)) score += 1;
    return { line, score, key };
  });

  const picked: string[] = [];
  let budget = maxChars;

  scored
    .sort((a, b) => b.score - a.score)
    .forEach((s) => {
      if (picked.length >= maxItems) return;
      if (s.score <= 0) return; // nur zeilen mit signal
      if (seen.has(s.key)) return;
      if (s.line.length > budget) return;
      picked.push(s.line);
      seen.add(s.key);
      budget -= s.line.length + 1;
    });

  return picked;
}

/* -------------------------- Vacancy Extraction ------------------------- */

export function extractVacancySignal(snippets?: Array<Snippet | string>): VacancySignal | null {
  const list = normalizeSnippets(snippets);
  if (list.length === 0) return null;

  const text = list.map((s) => `${s.title ? s.title + ': ' : ''}${s.text}`).join('\n').toLowerCase();

  const pctRegex =
    /(leerstand(?:s|squote|srate)?|wohnungsleerstand)[^%\n\r]*?(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i;
  const pctMatch = text.match(pctRegex);

  const qualHighRegex =
    /(überdurchschnittlich|deutlich\s+über|hoch(?:er)?\s+leerstand|hohe\s+leerstandsquote)/i;
  const qualLowRegex =
    /(unterdurchschnittlich|deutlich\s+unter|niedrig(?:er)?\s+leerstand|geringe\s+leerstandsquote)/i;

  let ratePct: number | undefined;
  if (pctMatch && pctMatch[2]) {
    const rawNum = pctMatch[2].replace(',', '.');
    const n = Number(rawNum);
    if (!Number.isNaN(n)) ratePct = n;
  }

  let qualifier: VacancySignal['qualifier'] | undefined;
  if (qualHighRegex.test(text)) qualifier = 'ueberdurchschnittlich';
  else if (qualLowRegex.test(text)) qualifier = 'unterdurchschnittlich';

  if (!qualifier && typeof ratePct === 'number') {
    if (ratePct >= 7) qualifier = 'hoch';
    else if (ratePct >= 4) qualifier = 'mittel';
    else qualifier = 'niedrig';
  }

  if (ratePct === undefined && !qualifier) return null;
  return { ratePct, qualifier, raw: pctMatch?.[0], hasExplicit: typeof ratePct === 'number' };
}

/* ----------------------- Morphologie & Heuristiken --------------------- */

function pickMorphologieNullable(value?: Morphologie | null): Morphologie | undefined {
  return value ?? undefined;
}

function inferDemand(
  morph: Morphologie | undefined,
  vacancy: VacancySignal | null
): 'hoch' | 'mittel' | 'niedrig' {
  let base: 'hoch' | 'mittel' | 'niedrig' = 'mittel';
  if (morph === 'innerstädtisch') base = 'hoch';
  if (morph === 'ländlich') base = 'niedrig';
  if (vacancy?.qualifier === 'hoch' || vacancy?.qualifier === 'ueberdurchschnittlich') base = 'niedrig';
  return base;
}

function inferTargetGroups(
  snippets: Array<Snippet | string> | undefined,
  object?: LocationObjectInfo,
  morph?: Morphologie
): string[] {
  const list = normalizeSnippets(snippets);
  const blob = list.map((s) => `${s.title ? s.title + ': ' : ''}${s.text}`).join('\n').toLowerCase();

  const groups = new Set<string>();
  if (object?.zimmer && object.zimmer >= 3) groups.add('Paare/kleine Familien');
  if (object?.flaeche && object.flaeche >= 80) groups.add('Paare/kleine Familien');
  if ((object?.zimmer && object.zimmer <= 2) || (object?.flaeche && object?.flaeche <= 60)) {
    groups.add('junge Berufstätige');
  }
  if (/\buni|hochschule|campus|studierendenwerk|student/i.test(blob)) groups.add('Studierende');
  if (/\bpendeln|bahnhof|s-bahn|u-bahn|verkehrsknoten|anschluss/i.test(blob)) groups.add('Berufspendler:innen');
  if (/\bbars?|caf[eée]s?|gastronomie|ausgehen|kreativ|szene|urban/i.test(blob)) groups.add('junge Berufstätige');
  if (/\bruhe|gr[üu]n|familienfreundlich|kita|grundschule/i.test(blob)) groups.add('Paare/kleine Familien');

  if (morph === 'innerstädtisch') groups.add('junge Berufstätige');
  if (morph === 'ländlich' || morph === 'randnah') groups.add('Paare/kleine Familien');

  return Array.from(groups).slice(0, 2);
}

/* ---------------------------- Style-Regeln ----------------------------- */

function buildStyleRules(
  compact: boolean,
  demand: 'hoch' | 'mittel' | 'niedrig',
  vacancy: VacancySignal | null,
  opts?: { morphKnown?: boolean; targetGroups?: string[]; evidenceHasAnchors?: boolean }
): string {
  const morphRule = opts?.morphKnown
    ? `- Satz 1: Lage verorten (z. B. „innerstädtisch/stadtnah/ländlich“) + 1 belegter Bezugspunkt/Erreichbarkeit + konkreter Nutzen (z. B. Pendeln).`
    : `- Satz 1: Lage knapp beschreiben (z. B. „zentral“, „gute Anbindung“) + 1 belegter Bezugspunkt/Erreichbarkeit + konkreter Nutzen.`;

  const tg = (opts?.targetGroups ?? []).join(' oder ');
  const targetGroupsRule = tg
    ? `- Satz 2: Zielgruppen klar benennen (z. B. ${tg}).`
    : `- Satz 2: Zielgruppen klar benennen (max. zwei).`;

  const evidenceRule = opts?.evidenceHasAnchors
    ? `- Nutze 1–2 POIs/Anker **nur** aus den Belegen (z. B. Plätze, Straßen, U-/S-Bahn, Hbf).`
    : `- Keine POIs erfinden; wenn keine Belege vorliegen, generisch bleiben.`;

  const vacancyRule = vacancy
    ? `- Wenn Leerstand vorhanden: Nenne die Quote (falls gegeben) und bewerte sie knapp (z. B. „überdurchschnittlich“).`
    : `- Wenn keine Leerstandsangabe vorhanden: keine Spekulation.`;

  const closure =
    demand === 'hoch'
      ? `- Abschluss: „breite Nachfrage; meist sehr zügig vermietbar, Leerstandsrisiko gering.“`
      : demand === 'mittel'
      ? `- Abschluss: „zügig vermietbar.“`
      : `- Abschluss: „Vermietung anspruchsvoll; mit längerer Vermarktung und ggf. Anreizen rechnen.“`;

  return `
Schreibe ${compact ? '2–3' : '4–6'} Sätze in natürlichem, investorenähnlichem Ton (kein Exposé, keine Floskeln).
${morphRule}
${targetGroupsRule}
${evidenceRule}
- Objektbezug (Zimmer/Fläche) nur, wenn es zur Zielgruppe beiträgt.
${vacancyRule}
${closure}
- Keine Dopplungen, präzise und alltagsnah formulieren.
`.trim();
}

/* ----------------------- Prompt-Builder (Main) ------------------------- */

export function buildLocationProfilePrompt(input: LocationProfileInput) {
  const { address, object, snippets, compact = false } = input;

  const morph = pickMorphologieNullable(input.morph);
  const vacancy = extractVacancySignal(snippets);
  const demand = inferDemand(morph, vacancy);
  const targetGroups = inferTargetGroups(snippets, object, morph);
  const evidence = buildEvidenceLines(snippets, 6, 700);
  const evidenceHasAnchors = evidence.some((l) =>
    /\b(platz|bahnhof|hbf|u-?bahnhof|s-?bahnhof|straße|strasse|ring|allee|gürtel|park|uni|hochschule|messe|klinikum)\b/i.test(
      l
    )
  );

  const allowedPlaceHint = `
Nutze nur real vorhandene, belegte Ortsbezüge. Wenn unsicher, schreibe generisch („die Lage“, „die Umgebung“). Keine Viertelnamen erfinden.
`.trim();

  const contextLines: string[] = [
    `Adresse: ${address}`,
    morph ? `Morphologie: ${morph}` : `Morphologie: unbekannt`,
    vacancy?.hasExplicit
      ? `Leerstand: ${vacancy.ratePct!.toFixed(1)} % (${vacancy.qualifier ?? 'Einordnung unbekannt'})`
      : vacancy?.qualifier
      ? `Leerstand: qualitative Einstufung „${vacancy.qualifier}“ (kein Prozentwert im Snippet)`
      : `Leerstand: keine Angabe im Snippet`,
    object?.zimmer ? `Zimmer: ${object.zimmer}` : null,
    object?.flaeche ? `Fläche: ${object.flaeche} m²` : null,
    object?.typ ? `Objekttyp: ${object.typ}` : null,
    targetGroups.length ? `Zielgruppen-Vorschlag: ${targetGroups.join(' oder ')}` : null,
  ].filter(Boolean) as string[];

  const style = buildStyleRules(compact, demand, vacancy, {
    morphKnown: Boolean(morph),
    targetGroups,
    evidenceHasAnchors,
  });
  const mustMentionVacancy = vacancy ? 'Ja' : 'Nein';

  const system = `
Du bist ein erfahrener Wohnimmobilien-Investor und erklärst Lagequalitäten knapp, menschlich und nutzenorientiert.
${allowedPlaceHint}
`.trim();

  const belegeBlock =
    evidence.length > 0
      ? `\nBelege (wörtliche Auszüge aus Snippets – nur als Faktenbasis, nicht abschreiben):\n- ${evidence.join('\n- ')}\n`
      : '';

  const user = `
Kontext:
${contextLines.join('\n')}${belegeBlock}

Aufgabe:
Formuliere eine kurze Lageeinschätzung in Deutsch.
- Zielgruppen: maximal zwei (siehe Kontext).
- Leerstand explizit nennen? ${mustMentionVacancy}.
- Schließe mit einer klaren Vermietungseinordnung (siehe Regeln).

Stilregeln:
${style}
`.trim();

  return { system, user, demand, vacancy, targetGroups, evidence };
}

/** Rückwärtskompatibler Alias */
export const buildLocationProfile = buildLocationProfilePrompt;
