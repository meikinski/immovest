import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Save analysis
export async function POST(req: Request) {
  try {
    await auth();
    const data = await req.json();

    // Generate ID if not provided
    const analysisId = data.analysisId || `analysis_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // For now, use localStorage on client
    // TODO: Save to Supabase

    // In a real implementation, this would save to database
    // For now, return the data with ID
    return NextResponse.json({
      success: true,
      analysisId,
      message: 'Analyse gespeichert',
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}

// Get all analyses for user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ analyses: [] });
    }

    // TODO: Fetch from Supabase
    // For now, return empty array (will use localStorage on client)

    return NextResponse.json({ analyses: [] });
  } catch (error) {
    console.error('Get analyses error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    );
  }
}
