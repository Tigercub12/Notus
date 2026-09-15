import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { tags, noteTags, notes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';



// Get tags for a specific note
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const db = getDb();

    // Verify note ownership
    const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, id), eq(notes.user_id, userId))).get();
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const noteTagsList = await db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color
    })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tag_id, tags.id))
    .where(eq(noteTags.note_id, id))
    .all();

    return NextResponse.json(noteTagsList);
  } catch (error) {
    console.error('Failed to get note tags', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a tag to a note (by name)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = (await req.json()) as any;
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const db = getDb();

    // Verify note ownership
    const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, id), eq(notes.user_id, userId))).get();
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const tagName = name.trim();

    // Find if tag exists globally for user
    let tag = await db.select().from(tags).where(and(eq(tags.name, tagName), eq(tags.user_id, userId))).get();

    if (!tag) {
      // Create it
      const newTagId = crypto.randomUUID();
      await db.insert(tags).values({
        id: newTagId,
        user_id: userId,
        name: tagName,
        color: '#e5eeff' // Default tag pill color
      });
      tag = await db.select().from(tags).where(eq(tags.id, newTagId)).get();
    }

    if (!tag) {
        return NextResponse.json({ error: 'Failed to find or create tag' }, { status: 500 });
    }

    // Link tag to note (ignore if already linked)
    try {
      await db.insert(noteTags).values({
        note_id: id,
        tag_id: tag.id
      });
    } catch (e: any) {
      if (!e.message?.includes('UNIQUE')) {
        throw e;
      }
      // If unique constraint fails, it means it's already linked, which is fine
    }

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Failed to add tag to note', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
