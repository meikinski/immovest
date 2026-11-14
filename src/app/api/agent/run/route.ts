// src/app/api/agent/run/route.ts
// Vollständige Analyse. Ablauf, Plan-Prüfung und Kostenschutz: src/lib/agentRun.ts
import { NextRequest } from 'next/server';
import { runWorkflow } from '@/lib/agentWorkflow';
import { geocodeBasics } from '@/utils/geocoding';
import { wikidataAreaByPoint } from '@/utils/wikidata';
import { agentRunPost } from '@/lib/agentRun';
import { standardSchutzDeps } from '@/lib/kostenSchutz';
import { supabasePlanStore } from '@/lib/gratisAnalyse';
import { mitMonitoring } from '@/lib/monitoring/apiRoute';

async function handlePOST(req: NextRequest) {
  return agentRunPost(req, {
    ...(await standardSchutzDeps()),
    planStore: supabasePlanStore(),
    runWorkflow,
    geocodeBasics,
    wikidataAreaByPoint,
  });
}

export const POST = mitMonitoring('POST /api/agent/run', handlePOST);
