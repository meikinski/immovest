import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Get single analysis
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await auth();
    await context.params;

    // TODO: Fetch from Supabase
    // For now, return 404 (client will use localStorage)

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' },
      { status: 500 }
    );
  }
}

// Delete analysis
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // TODO: Delete from Supabase

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' },
      { status: 500 }
    );
  }
}
