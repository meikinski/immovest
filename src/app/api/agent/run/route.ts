// src/app/api/agent/run/route.ts
// Vollständige Analyse. Ablauf, Plan-Prüfung und Kostenschutz: src/lib/agentRun.ts
import { NextRequest } from 'next/server';
import { runWorkflow } from '@/lib/agentWorkflow';
import { geocodeBasics } from '@/utils/geocoding';
import { wikidataAreaByPoint } from '@/utils/wikidata';
import { agentRunPost } from '@/lib/agentRun';
import { standardSchutzDeps } from '@/lib/kostenSchutz';
import { supabasePlanStore } from '@/lib/gratisAnalyse';

export async function POST(req: NextRequest) {
  return agentRunPost(req, {
    ...(await standardSchutzDeps()),
    planStore: supabasePlanStore(),
    runWorkflow,
    geocodeBasics,
    wikidataAreaByPoint,
  });
}
