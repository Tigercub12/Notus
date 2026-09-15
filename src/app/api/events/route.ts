import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq, and, gte, asc } from 'drizzle-orm';



export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const upcoming = searchParams.get('upcoming');
    const noteId = searchParams.get('note_id');
    const userId = session.user.id;
    const db = getDb();
    
    let conditions: any[] = [eq(events.user_id, userId)];

    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(gte(events.event_date, today));
    }
    
    if (noteId) {
      conditions.push(eq(events.note_id, noteId));
    }

    const userEvents = await db.select().from(events)
      .where(and(...conditions))
      .orderBy(asc(events.event_date))
      .all();

    return NextResponse.json(userEvents);
  } catch (error) {
    console.error('Failed to get events', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, event_date, end_date, note_id } = (await req.json()) as any;
    
    if (!title || !event_date) {
      return NextResponse.json({ error: 'Title and event_date are required' }, { status: 400 });
    }

    const userId = session.user.id;
    const db = getDb();
    const newEventId = crypto.randomUUID();
    
    await db.insert(events).values({
      id: newEventId,
      user_id: userId,
      title,
      description: description || null,
      event_date,
      end_date: end_date || null,
      note_id: note_id || null
    });

    const newEvent = await db.select().from(events).where(eq(events.id, newEventId)).get();
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to create event', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = req.nextUrl.searchParams.get('id');
    if (!eventId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { title, description, event_date, end_date } = (await req.json()) as any;

    const db = getDb();
    const userId = session.user.id;

    // Check ownership
    const existingEvent = await db.select({ id: events.id }).from(events).where(and(eq(events.id, eventId), eq(events.user_id, userId))).get();
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updateData: Partial<typeof events.$inferInsert> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db.update(events)
        .set(updateData)
        .where(and(eq(events.id, eventId), eq(events.user_id, userId)))
        .run();
    }

    const updatedEvent = await db.select().from(events).where(eq(events.id, eventId)).get();
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = req.nextUrl.searchParams.get('id');
    if (!eventId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const db = getDb();
    const userId = session.user.id;

    const existingEvent = await db.select({ id: events.id }).from(events).where(and(eq(events.id, eventId), eq(events.user_id, userId))).get();
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await db.delete(events).where(and(eq(events.id, eventId), eq(events.user_id, userId))).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const runtime = 'edge';
