import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { tags, noteTags, notes } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const noteId = req.nextUrl.searchParams.get('noteId');
    const db = getDb();
    
    if (noteId) {
      // Get tags for a specific note
      const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).get();
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

      const noteTagsList = await db.select({ id: tags.id, name: tags.name, color: tags.color })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tag_id, tags.id))
        .where(eq(noteTags.note_id, noteId))
        .all();
      return NextResponse.json(noteTagsList);
    }

    const userTags = await db.select().from(tags).where(eq(tags.user_id, userId)).orderBy(desc(tags.created_at)).all();
    return NextResponse.json(userTags);
  } catch (error) {
    console.error('Failed to get tags', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, color } = (await req.json()) as any;
    if (!name || name.trim() === '') return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });

    const userId = session.user.id;
    const noteId = req.nextUrl.searchParams.get('noteId');
    const db = getDb();
    const tagName = name.trim();

    if (noteId) {
      // Add a tag to a note
      const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).get();
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

      let tag = await db.select().from(tags).where(and(eq(tags.name, tagName), eq(tags.user_id, userId))).get();
      if (!tag) {
        const newTagId = crypto.randomUUID();
        await db.insert(tags).values({ id: newTagId, user_id: userId, name: tagName, color: '#e5eeff' });
        tag = await db.select().from(tags).where(eq(tags.id, newTagId)).get();
      }
      if (!tag) return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });

      try {
        await db.insert(noteTags).values({ note_id: noteId, tag_id: tag.id });
      } catch (e: any) {
        if (!e.message?.includes('UNIQUE')) throw e;
      }
      return NextResponse.json(tag, { status: 201 });
    }

    // Create a generic tag
    const newTagId = crypto.randomUUID();
    try {
      await db.insert(tags).values({ id: newTagId, user_id: userId, name: tagName, color: color || '#00288e' });
    } catch (e: any) {
      if (e.message && e.message.includes('UNIQUE')) return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
      throw e;
    }
    const newTag = await db.select().from(tags).where(eq(tags.id, newTagId)).get();
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Failed to create tag', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const noteId = req.nextUrl.searchParams.get('noteId');
    const tagId = req.nextUrl.searchParams.get('id');
    const db = getDb();
    const userId = session.user.id;

    if (noteId && tagId) {
      // Remove tag from note
      const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).get();
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      await db.delete(noteTags).where(and(eq(noteTags.note_id, noteId), eq(noteTags.tag_id, tagId))).run();
      return NextResponse.json({ success: true });
    }

    if (tagId) {
      // Delete tag globally
      const result = await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.user_id, userId))).run();
      if (result.meta?.changes === 0) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete tag', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
