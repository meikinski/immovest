'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { deleteAnalysis, getAllAnalyses, type SavedAnalysis } from '@/lib/storage';
import { duplicateKey } from '@/lib/analysisDb';

const nachDatum = (list: SavedAnalysis[]) =>
  [...list].sort((a, b) => String(b.updatedAt ?? b.createdAt ?? '').localeCompare(String(a.updatedAt ?? a.createdAt ?? '')));

/**
 * Gespeicherte Analysen: lokale Kopie sofort, dann mit Supabase zusammengeführt
 * (andere Geräte, gelöschte Browserdaten).
 */
export function useGespeicherteAnalysen(aktiv = true) {
  const { userId, isLoaded } = useAuth();
  const [analysen, setAnalysen] = useState<SavedAnalysis[]>([]);
  const [laedt, setLaedt] = useState(true);

  const laden = useCallback(async () => {
    const lokal = getAllAnalyses(userId ?? null);
    setAnalysen(nachDatum(lokal));
    try {
      const res = await fetch('/api/analysis');
      if (!res.ok) return;
      const { analyses: cloud } = (await res.json()) as { analyses?: Array<SavedAnalysis & { legacy?: boolean }> };
      if (!cloud?.length) return;

      const zusammen = new Map<string, SavedAnalysis>();
      for (const a of lokal) zusammen.set(a.analysisId, a);
      const lokaleSchluessel = new Set(lokal.map(duplicateKey));
      for (const a of cloud) {
        // Alte Supabase-Zeilen hatten andere IDs als die lokale Kopie → über Adresse + Kaufpreis erkennen
        if (a.legacy && lokaleSchluessel.has(duplicateKey(a))) continue;
        const vorhanden = zusammen.get(a.analysisId);
        if (!vorhanden || String(a.updatedAt) > String(vorhanden.updatedAt ?? '')) {
          zusammen.set(a.analysisId, vorhanden ? { ...vorhanden, ...a } : a);
        }
      }
      setAnalysen(nachDatum([...zusammen.values()]));
    } catch (error) {
      console.error('Gespeicherte Analysen konnten nicht vom Server geladen werden:', error);
    } finally {
      setLaedt(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded || !aktiv) return;
    laden().finally(() => setLaedt(false));
  }, [isLoaded, aktiv, laden]);

  const loeschen = useCallback(async (analyse: SavedAnalysis) => {
    const name = analyse.analysisName || analyse.adresse || 'diese Analyse';
    if (!window.confirm(`„${name}“ wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    try {
      const res = await fetch(`/api/analysis/${encodeURIComponent(analyse.analysisId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      deleteAnalysis(userId || null, analyse.analysisId);
      setAnalysen(prev => prev.filter(a => a.analysisId !== analyse.analysisId));
      toast.success('Analyse gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen der Analyse:', error);
      toast.error('Fehler beim Löschen der Analyse');
    }
  }, [userId]);

  return { analysen, laedt, loeschen, neuLaden: laden };
}
