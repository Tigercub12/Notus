import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const noteId = id;
    const db = getDb();
    
    const note = await db.select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .get();
      
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const noteId = id;
    const body = (await request.json()) as any;
    const db = getDb();

    // Verify note belongs to user or create new
    const existing = await db.select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
      .get();
    
    if (!existing) {
      // Create it
      await db.insert(notes).values({
        id: noteId,
        user_id: userId,
        title: body.title || 'โน้ตใหม่',
        content: body.content || '',
        is_pinned: body.is_pinned ? 1 : 0,
        canvas_image_url: body.canvas_image_url || null,
      });
      return NextResponse.json({ success: true, created: true });
    }

    // Update existing note
    const updateData: Partial<typeof notes.$inferInsert> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned ? 1 : 0;
    if (body.canvas_image_url !== undefined) updateData.canvas_image_url = body.canvas_image_url;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(notes)
        .set(updateData)
        .where(and(eq(notes.id, noteId), eq(notes.user_id, userId)))
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = getDb();

    const result = await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.user_id, userId)))
      .run();
    
    // Cloudflare D1 meta exposes changes
    if (result.meta?.changes === 0) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
