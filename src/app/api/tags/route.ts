import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = getDb();
    
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = (await req.json()) as any;
    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const db = getDb();
    const newTagId = crypto.randomUUID();
    
    try {
      await db.insert(tags).values({
        id: newTagId,
        user_id: userId,
        name,
        color: color || '#00288e'
      });
    } catch (e: any) {
      if (e.message && e.message.includes('UNIQUE')) {
        return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
      }
      throw e;
    }

    const newTag = await db.select().from(tags).where(eq(tags.id, newTagId)).get();
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Failed to create tag', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
