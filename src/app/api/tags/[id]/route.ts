import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const userId = session.user.id;

    // Delete tag (will cascade to note_tags due to schema)
    const result = await db.delete(tags).where(and(eq(tags.id, id), eq(tags.user_id, userId))).run();
    
    if (result.meta?.changes === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tag', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
