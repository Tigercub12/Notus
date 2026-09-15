import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { attachments, notes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = getDb();
    
    // Join attachments with notes to verify ownership
    const userAttachments = await db.select({
      id: attachments.id,
      note_id: attachments.note_id,
      r2_key: attachments.r2_key,
      file_name: attachments.file_name,
      mime_type: attachments.mime_type,
      size_bytes: attachments.size_bytes,
      created_at: attachments.created_at,
      note_title: notes.title
    })
    .from(attachments)
    .innerJoin(notes, eq(attachments.note_id, notes.id))
    .where(eq(notes.user_id, userId))
    .orderBy(desc(attachments.created_at))
    .all();
    
    return NextResponse.json(userAttachments);
  } catch (error) {
    console.error('Failed to get files', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const noteId = data.get('note_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ไฟล์มีขนาดเกิน 10MB' }, { status: 400 });
    }

    if (!noteId) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const db = getDb();

    // Verify Note belongs to user
    const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, noteId), eq(notes.user_id, userId))).get();
    if (!note) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    const uniqueFilename = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    
    // Upload to Cloudflare R2
    const ctx = getRequestContext();
    if (!ctx.env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding not found');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    await ctx.env.R2_BUCKET.put(uniqueFilename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      }
    });

    const id = crypto.randomUUID();

    await db.insert(attachments).values({
      id,
      note_id: noteId,
      r2_key: uniqueFilename,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    const newAttachment = await db.select().from(attachments).where(eq(attachments.id, id)).get();
    return NextResponse.json(newAttachment, { status: 201 });
  } catch (error) {
    console.error('Failed to upload file', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
