import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q');
    const db = getDb();
    
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
