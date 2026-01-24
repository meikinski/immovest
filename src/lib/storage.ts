// Local storage utilities for analyses
// TODO: Migrate to Supabase

export type SavedAnalysis = {
  analysisId: string;
  analysisName: string;
  createdAt: string;
  updatedAt: string;
  kaufpreis: number;
  adresse: string;
  flaeche: number;
  zimmer: number;
  nettorendite: number;
  cashflow_operativ: number;
  // ... all other fields
  [key: string]: unknown;
};

export type SavedScenario = {
  scenarioId: string;
  analysisId: string;
  scenarioName: string;
  createdAt: string;
  updatedAt: string;

  // Scenario deltas/adjustments
  mieteDeltaPct: number;
  preisDeltaPct: number;
  zinsDeltaPp: number;
  tilgungDeltaPp: number;
  ekDeltaPct: number;
  sondertilgungJaehrlich: number;

  // Scenario settings
  wertentwicklungAktiv: boolean;
  wertentwicklungPct: number;
  darlehensTyp: 'annuitaet' | 'degressiv';
  mietInflationPct: number;
  kostenInflationPct: number;
  verkaufsNebenkostenPct: number;

  // Calculated scenario results
  scenarioKaufpreis: number;
  scenarioMiete: number;
  scenarioZins: number;
  scenarioTilgung: number;
  scenarioEk: number;
  scenarioCashflowVorSteuer: number;
  scenarioCashflowNachSteuer: number;
  scenarioNettorendite: number;
  scenarioBruttorendite: number;
  scenarioEkRendite: number;
  scenarioNoiMonthly: number;
  scenarioDscr: number;
  scenarioRateMonat: number;
  scenarioAbzahlungsjahr: number;
};

const STORAGE_KEY_PREFIX = 'immovest_analysis_';
const STORAGE_INDEX_KEY = 'immovest_analyses_index';
const SCENARIOS_STORAGE_KEY_PREFIX = 'immovest_scenarios_';
const SCENARIOS_INDEX_KEY = 'immovest_scenarios_index';

/**
 * Save analysis to localStorage
 */
export function saveAnalysis(userId: string | null, data: Record<string, unknown>): string {
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;

  // Generate ID if not exists
  const analysisId = (data.analysisId as string) || `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Get existing analyses
  const existingData = localStorage.getItem(storageKey);
  const analyses: Record<string, unknown>[] = existingData ? JSON.parse(existingData) : [];

  // Check if updating existing
  const existingIndex = analyses.findIndex((a) => a.analysisId === analysisId);

  const analysisData = {
    ...data,
    analysisId,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    // Update
    analyses[existingIndex] = analysisData;
  } else {
    // Create new
    analyses.push(analysisData);
  }

  // Save back
  localStorage.setItem(storageKey, JSON.stringify(analyses));

  // Update index for quick lookup
  updateAnalysisIndex(userId, analysisId, data.analysisName as string || data.adresse as string || 'Unbenannt');

  return analysisId;
}

/**
 * Load analysis from localStorage
 */
export function loadAnalysis(userId: string | null, analysisId: string): Record<string, unknown> | null {
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return null;

  const analyses: Record<string, unknown>[] = JSON.parse(existingData);
  return analyses.find((a) => a.analysisId === analysisId) || null;
}

/**
 * Get all analyses for user
 */
export function getAllAnalyses(userId: string | null): SavedAnalysis[] {
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return [];

  return JSON.parse(existingData) as SavedAnalysis[];
}

/**
 * Delete analysis
 */
export function deleteAnalysis(userId: string | null, analysisId: string): boolean {
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return false;

  const analyses: Record<string, unknown>[] = JSON.parse(existingData);
  const filtered = analyses.filter((a) => a.analysisId !== analysisId);

  localStorage.setItem(storageKey, JSON.stringify(filtered));
  return true;
}

/**
 * Update analysis index for quick access
 */
function updateAnalysisIndex(userId: string | null, analysisId: string, name: string) {
  const indexKey = userId ? `${STORAGE_INDEX_KEY}_${userId}` : `${STORAGE_INDEX_KEY}_guest`;

  const existingIndex = localStorage.getItem(indexKey);
  const index: Array<{ id: string; name: string; updatedAt: string }> = existingIndex ? JSON.parse(existingIndex) : [];

  const existing = index.find((item) => item.id === analysisId);
  if (existing) {
    existing.name = name;
    existing.updatedAt = new Date().toISOString();
  } else {
    index.push({
      id: analysisId,
      name,
      updatedAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(indexKey, JSON.stringify(index));
}

/**
 * Save scenario to localStorage
 */
export function saveScenario(userId: string | null, analysisId: string, data: Partial<SavedScenario>): string {
  const storageKey = userId ? `${SCENARIOS_STORAGE_KEY_PREFIX}${userId}_${analysisId}` : `${SCENARIOS_STORAGE_KEY_PREFIX}guest_${analysisId}`;

  // Generate ID if not exists
  const scenarioId = (data.scenarioId as string) || `scenario_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Get existing scenarios for this analysis
  const existingData = localStorage.getItem(storageKey);
  const scenarios: SavedScenario[] = existingData ? JSON.parse(existingData) : [];

  // Check if updating existing
  const existingIndex = scenarios.findIndex((s) => s.scenarioId === scenarioId);

  const scenarioData: SavedScenario = {
    scenarioId,
    analysisId,
    scenarioName: data.scenarioName || 'Unbenanntes Szenario',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mieteDeltaPct: data.mieteDeltaPct || 0,
    preisDeltaPct: data.preisDeltaPct || 0,
    zinsDeltaPp: data.zinsDeltaPp || 0,
    tilgungDeltaPp: data.tilgungDeltaPp || 0,
    ekDeltaPct: data.ekDeltaPct || 0,
    sondertilgungJaehrlich: data.sondertilgungJaehrlich || 0,
    wertentwicklungAktiv: data.wertentwicklungAktiv || false,
    wertentwicklungPct: data.wertentwicklungPct || 0,
    darlehensTyp: data.darlehensTyp || 'annuitaet',
    mietInflationPct: data.mietInflationPct || 0,
    kostenInflationPct: data.kostenInflationPct || 0,
    verkaufsNebenkostenPct: data.verkaufsNebenkostenPct || 7,
    scenarioKaufpreis: data.scenarioKaufpreis || 0,
    scenarioMiete: data.scenarioMiete || 0,
    scenarioZins: data.scenarioZins || 0,
    scenarioTilgung: data.scenarioTilgung || 0,
    scenarioEk: data.scenarioEk || 0,
    scenarioCashflowVorSteuer: data.scenarioCashflowVorSteuer || 0,
    scenarioCashflowNachSteuer: data.scenarioCashflowNachSteuer || 0,
    scenarioNettorendite: data.scenarioNettorendite || 0,
    scenarioBruttorendite: data.scenarioBruttorendite || 0,
    scenarioEkRendite: data.scenarioEkRendite || 0,
    scenarioNoiMonthly: data.scenarioNoiMonthly || 0,
    scenarioDscr: data.scenarioDscr || 0,
    scenarioRateMonat: data.scenarioRateMonat || 0,
    scenarioAbzahlungsjahr: data.scenarioAbzahlungsjahr || 0,
  };

  if (existingIndex >= 0) {
    // Update
    scenarios[existingIndex] = scenarioData;
  } else {
    // Create new
    scenarios.push(scenarioData);
  }

  // Save back
  localStorage.setItem(storageKey, JSON.stringify(scenarios));

  // Update index
  updateScenarioIndex(userId, analysisId, scenarioId, scenarioData.scenarioName);

  return scenarioId;
}

/**
 * Load scenario from localStorage
 */
export function loadScenario(userId: string | null, analysisId: string, scenarioId: string): SavedScenario | null {
  const storageKey = userId ? `${SCENARIOS_STORAGE_KEY_PREFIX}${userId}_${analysisId}` : `${SCENARIOS_STORAGE_KEY_PREFIX}guest_${analysisId}`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return null;

  const scenarios: SavedScenario[] = JSON.parse(existingData);
  return scenarios.find((s) => s.scenarioId === scenarioId) || null;
}

/**
 * Get all scenarios for an analysis
 */
export function getAllScenarios(userId: string | null, analysisId: string): SavedScenario[] {
  const storageKey = userId ? `${SCENARIOS_STORAGE_KEY_PREFIX}${userId}_${analysisId}` : `${SCENARIOS_STORAGE_KEY_PREFIX}guest_${analysisId}`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return [];

  return JSON.parse(existingData) as SavedScenario[];
}

/**
 * Delete scenario
 */
export function deleteScenario(userId: string | null, analysisId: string, scenarioId: string): boolean {
  const storageKey = userId ? `${SCENARIOS_STORAGE_KEY_PREFIX}${userId}_${analysisId}` : `${SCENARIOS_STORAGE_KEY_PREFIX}guest_${analysisId}`;

  const existingData = localStorage.getItem(storageKey);
  if (!existingData) return false;

  const scenarios: SavedScenario[] = JSON.parse(existingData);
  const filtered = scenarios.filter((s) => s.scenarioId !== scenarioId);

  localStorage.setItem(storageKey, JSON.stringify(filtered));

  // Remove from index
  removeScenarioFromIndex(userId, analysisId, scenarioId);

  return true;
}

/**
 * Update scenario index for quick access
 */
function updateScenarioIndex(userId: string | null, analysisId: string, scenarioId: string, name: string) {
  const indexKey = userId ? `${SCENARIOS_INDEX_KEY}_${userId}_${analysisId}` : `${SCENARIOS_INDEX_KEY}_guest_${analysisId}`;

  const existingIndex = localStorage.getItem(indexKey);
  const index: Array<{ id: string; name: string; updatedAt: string }> = existingIndex ? JSON.parse(existingIndex) : [];

  const existing = index.find((item) => item.id === scenarioId);
  if (existing) {
    existing.name = name;
    existing.updatedAt = new Date().toISOString();
  } else {
    index.push({
      id: scenarioId,
      name,
      updatedAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(indexKey, JSON.stringify(index));
}

/**
 * Remove scenario from index
 */
function removeScenarioFromIndex(userId: string | null, analysisId: string, scenarioId: string) {
  const indexKey = userId ? `${SCENARIOS_INDEX_KEY}_${userId}_${analysisId}` : `${SCENARIOS_INDEX_KEY}_guest_${analysisId}`;

  const existingIndex = localStorage.getItem(indexKey);
  if (!existingIndex) return;

  const index: Array<{ id: string; name: string; updatedAt: string }> = JSON.parse(existingIndex);
  const filtered = index.filter((item) => item.id !== scenarioId);

  localStorage.setItem(indexKey, JSON.stringify(filtered));
}
