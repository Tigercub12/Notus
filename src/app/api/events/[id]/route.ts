import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const db = getDb();
    const userId = session.user.id;

    const result = await db.delete(events).where(and(eq(events.id, eventId), eq(events.user_id, userId))).run();
    
    if (result.meta?.changes === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
