import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { attachments, notes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename?: string[] }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const filenameParam = resolvedParams.filename;
    const userId = session.user.id;
    const db = getDb();

    // If filename is provided, return the file stream
    if (filenameParam && filenameParam.length > 0) {
      const filename = filenameParam[0];
      const attachment = await db.select({
        id: attachments.id,
        r2_key: attachments.r2_key,
        file_name: attachments.file_name,
        mime_type: attachments.mime_type
      })
      .from(attachments)
      .innerJoin(notes, eq(attachments.note_id, notes.id))
      .where(and(eq(attachments.r2_key, filename), eq(notes.user_id, userId)))
      .get();

      if (!attachment) return NextResponse.json({ error: 'File not found' }, { status: 404 });

      const ctx = getRequestContext();
      if (!ctx.env.R2_BUCKET) throw new Error('R2_BUCKET binding not found');

      const object = await ctx.env.R2_BUCKET.get(filename);
      if (!object || !object.body) return NextResponse.json({ error: 'File not found in R2' }, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Content-Type', attachment.mime_type || 'application/octet-stream');
      const encodedFilename = encodeURIComponent(attachment.file_name);
      headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
      headers.set('Cache-Control', 'private, max-age=3600');

      return new NextResponse(object.body as unknown as ReadableStream, { headers });
    }

    // Otherwise, return the list of files
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
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const noteId = data.get('note_id') as string;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 });

    const userId = session.user.id;
    const db = getDb();

    let finalNoteId = noteId;
    if (!finalNoteId) {
      finalNoteId = crypto.randomUUID();
      await db.insert(notes).values({
        id: finalNoteId,
        user_id: userId,
        title: 'Note from Upload',
        content: '',
      });
    } else {
      const note = await db.select({ id: notes.id }).from(notes).where(and(eq(notes.id, finalNoteId), eq(notes.user_id, userId))).get();
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const ctx = getRequestContext();
    if (!ctx.env.R2_BUCKET) throw new Error('R2_BUCKET binding not found');

    const fileExt = file.name.split('.').pop() || '';
    const r2Key = `${userId}/${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    await ctx.env.R2_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const attachmentId = crypto.randomUUID();
    await db.insert(attachments).values({
      id: attachmentId,
      note_id: finalNoteId,
      r2_key: r2Key,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    });

    const newAttachment = await db.select().from(attachments).where(eq(attachments.id, attachmentId)).get();
    return NextResponse.json({ url: `/api/files/${r2Key}`, attachment: newAttachment }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload file', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename?: string[] }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const filenameParam = resolvedParams.filename;
    
    let idToDelete = req.nextUrl.searchParams.get('id');
    const db = getDb();
    const userId = session.user.id;
    
    // If filename route parameter is used (e.g. /api/files/filename.jpg method DELETE)
    if (filenameParam && filenameParam.length > 0) {
      const r2Key = filenameParam[0];
      const attachment = await db.select({ id: attachments.id }).from(attachments).innerJoin(notes, eq(attachments.note_id, notes.id)).where(and(eq(attachments.r2_key, r2Key), eq(notes.user_id, userId))).get();
      if (!attachment) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      idToDelete = attachment.id;
    }

    if (!idToDelete) return NextResponse.json({ error: 'Missing file id or filename' }, { status: 400 });

    const attachment = await db.select({
      id: attachments.id,
      r2_key: attachments.r2_key,
    })
    .from(attachments)
    .innerJoin(notes, eq(attachments.note_id, notes.id))
    .where(and(eq(attachments.id, idToDelete), eq(notes.user_id, userId)))
    .get();

    if (!attachment) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const ctx = getRequestContext();
    if (ctx.env.R2_BUCKET) {
      await ctx.env.R2_BUCKET.delete(attachment.r2_key);
    }
    
    await db.delete(attachments).where(eq(attachments.id, idToDelete)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
