'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useImmoStore } from '@/store/useImmoStore';
import { saveAnalysis } from '@/lib/storage';
import { toast } from 'sonner';

export function SaveAnalysisButton() {
  const { userId } = useAuth();
  const exportState = useImmoStore((s) => s.exportState);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const stateData = exportState();

      // Save to Supabase via API
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }

      const result = await response.json();
      console.log('✅ Analyse gespeichert:', result.analysisId);

      // Also save to localStorage as backup
      saveAnalysis(userId || null, stateData);

      setSaved(true);
      toast.success('Analyse erfolgreich gespeichert');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      toast.error('Fehler beim Speichern der Analyse');
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
          {isSaving ? 'Speichere...' : 'Immobilie speichern'}
        </>
      )}
    </button>
  );
}
