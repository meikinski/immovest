'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Trash2, Loader2, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { getAllScenarios, deleteScenario, type SavedScenario } from '@/lib/storage';
import { toast } from 'sonner';

interface LoadScenariosDialogProps {
  analysisId?: string;
  onLoadScenario: (scenario: SavedScenario) => void;
}

export function LoadScenariosDialog({ analysisId, onLoadScenario }: LoadScenariosDialogProps) {
  const { userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load scenarios when dialog opens
  useEffect(() => {
    if (isOpen && analysisId) {
      loadScenarios();
    }
  }, [isOpen, analysisId]);

  const loadScenarios = async () => {
    if (!analysisId) return;

    setIsLoading(true);
    try {
      // Try to load from Supabase first
      const response = await fetch(`/api/scenarios?analysisId=${analysisId}`);

      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios || []);
      } else {
        // Fallback to localStorage
        const localScenarios = getAllScenarios(userId || null, analysisId);
        setScenarios(localScenarios);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
      // Fallback to localStorage
      const localScenarios = getAllScenarios(userId || null, analysisId);
      setScenarios(localScenarios);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    onLoadScenario(scenario);
    setIsOpen(false);
    toast.success(`Szenario "${scenario.scenarioName}" geladen`);
  };

  const handleDeleteScenario = async (scenarioId: string, scenarioName: string) => {
    if (!analysisId) return;

    if (!confirm(`Möchtest du das Szenario "${scenarioName}" wirklich löschen?`)) {
      return;
    }

    try {
      // Delete from Supabase
      const response = await fetch(`/api/scenarios?scenarioId=${scenarioId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Szenario gelöscht');
      }

      // Also delete from localStorage
      deleteScenario(userId || null, analysisId, scenarioId);

      // Reload scenarios
      loadScenarios();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Fehler beim Löschen des Szenarios');
    }
  };

  if (!analysisId) {
    return (
      <button
        disabled
        className="btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed"
        title="Bitte speichere zuerst die Analyse"
      >
        <FolderOpen size={18} />
        Szenarien laden
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary flex items-center gap-2"
      >
        <FolderOpen size={18} />
        Szenarien laden
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Gespeicherte Szenarien</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
              ) : scenarios.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Noch keine Szenarien gespeichert</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.scenarioId}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{scenario.scenarioName}</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>Miete: {scenario.mieteDeltaPct > 0 ? '+' : ''}{scenario.mieteDeltaPct}%</div>
                            <div>Preis: {scenario.preisDeltaPct > 0 ? '+' : ''}{scenario.preisDeltaPct}%</div>
                            <div>Zins: {scenario.zinsDeltaPp > 0 ? '+' : ''}{scenario.zinsDeltaPp}pp</div>
                            <div>Nettorendite: {scenario.scenarioNettorendite.toFixed(2)}%</div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Erstellt: {new Date(scenario.createdAt).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadScenario(scenario)}
                            className="btn-primary text-sm px-3 py-2"
                          >
                            Laden
                          </button>
                          <button
                            onClick={() => handleDeleteScenario(scenario.scenarioId, scenario.scenarioName)}
                            className="btn-secondary text-sm px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6">
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary w-full"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
