import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { attachments, notes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRequestContext } from '@cloudflare/next-on-pages';



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;
    const userId = session.user.id;
    const db = getDb();

    // Verify user owns this file
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

    if (!attachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ctx = getRequestContext();
    if (!ctx.env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding not found');
    }

    const object = await ctx.env.R2_BUCKET.get(filename);
    
    if (!object || !object.body) {
      return NextResponse.json({ error: 'File not found in R2' }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Content-Type', attachment.mime_type || 'application/octet-stream');
    const encodedFilename = encodeURIComponent(attachment.file_name);
    headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    headers.set('Cache-Control', 'private, max-age=3600');

    return new NextResponse(object.body as unknown as ReadableStream, {
      headers,
    });
  } catch (error) {
    console.error('Failed to serve file', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;
    const userId = session.user.id;
    const db = getDb();

    // Verify user owns this file
    const attachment = await db.select({
      id: attachments.id,
      r2_key: attachments.r2_key,
    })
    .from(attachments)
    .innerJoin(notes, eq(attachments.note_id, notes.id))
    .where(and(eq(attachments.r2_key, filename), eq(notes.user_id, userId)))
    .get();

    if (!attachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const ctx = getRequestContext();
    if (ctx.env.R2_BUCKET) {
      await ctx.env.R2_BUCKET.delete(filename);
    }

    await db.delete(attachments).where(eq(attachments.id, attachment.id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
