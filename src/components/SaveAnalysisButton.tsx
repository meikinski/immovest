'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useImmoStore } from '@/store/useImmoStore';
import { saveAnalysis } from '@/lib/storage';

export function SaveAnalysisButton() {
  const { userId } = useAuth();
  const exportState = useImmoStore((s) => s.exportState);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const stateData = exportState();

      // Save to localStorage (for now)
      const analysisId = saveAnalysis(userId || null, stateData);

      console.log('Analyse gespeichert:', analysisId);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Analyse');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className={[
        'btn-primary flex items-center gap-2 transition-all',
        saved ? 'bg-green-600 hover:bg-green-700' : '',
      ].join(' ')}
    >
      {saved ? (
        <>
          <Check size={18} />
          Gespeichert
        </>
      ) : (
        <>
          <Save size={18} />
          {isSaving ? 'Speichere...' : 'Ergebnis speichern'}
        </>
      )}
    </button>
  );
}
