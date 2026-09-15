import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { noteTags, notes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, tagId } = await params;
    const userId = session.user.id;
    const db = getDb();

    // Verify note ownership
    const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, id), eq(notes.user_id, userId))).get();
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await db.delete(noteTags).where(and(eq(noteTags.note_id, id), eq(noteTags.tag_id, tagId))).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove tag from note', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
