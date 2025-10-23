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

const STORAGE_KEY_PREFIX = 'immovest_analysis_';
const STORAGE_INDEX_KEY = 'immovest_analyses_index';

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
