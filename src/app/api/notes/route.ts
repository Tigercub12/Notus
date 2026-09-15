import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';



export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q');
    const noteId = searchParams.get('id');
    const db = getDb();
    
    if (noteId) {
      const note = await db.select().from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, session.user.id))).get();
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      return NextResponse.json(note);
    }
    
    let userNotes;
    
    if (q && q.trim() !== '') {
      try {
        // Escape quotes for FTS query
        const safeQ = `"${q.replace(/"/g, '""')}"*`;
        userNotes = await db.all(sql`
          SELECT n.* 
          FROM notes n
          JOIN notes_fts f ON n.id = f.id
          WHERE n.user_id = ${session.user.id} AND notes_fts MATCH ${safeQ}
          ORDER BY n.is_pinned DESC, rank
        `);
      } catch (ftsError) {
        // Fallback to LIKE if notes_fts virtual table is not yet initialized
        console.warn('FTS query failed, falling back to LIKE search', ftsError);
        const likeQ = `%${q}%`;
        userNotes = await db.all(sql`
          SELECT * FROM notes 
          WHERE user_id = ${session.user.id} 
          AND (title LIKE ${likeQ} OR content LIKE ${likeQ})
          ORDER BY is_pinned DESC, updated_at DESC
        `);
      }
    } else {
      userNotes = await db.select()
        .from(notes)
        .where(eq(notes.user_id, session.user.id))
        .orderBy(desc(notes.is_pinned), desc(notes.updated_at))
        .all();
    }

    return NextResponse.json(userNotes);
  } catch (error) {
    console.error('Failed to get notes', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content } = (await req.json()) as any;
    const db = getDb();
    const newNoteId = crypto.randomUUID();
    
    await db.insert(notes).values({
      id: newNoteId,
      user_id: session.user.id,
      title: title || 'New Note',
      content: content || '',
    });

    const newNote = await db.select().from(notes).where(eq(notes.id, newNoteId)).get();
    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = req.nextUrl.searchParams.get('id');
    if (!noteId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const userId = session.user.id;
    const body = (await req.json()) as any;
    const db = getDb();

    const existing = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).get();
    
    if (!existing) {
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

    const updateData: Partial<typeof notes.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned ? 1 : 0;
    if (body.canvas_image_url !== undefined) updateData.canvas_image_url = body.canvas_image_url;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(notes).set(updateData).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).run();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = req.nextUrl.searchParams.get('id');
    if (!noteId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = getDb();
    const result = await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, session.user.id))).run();
    if (result.meta?.changes === 0) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}

export const runtime = 'edge';
