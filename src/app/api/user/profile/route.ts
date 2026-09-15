import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';



export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const user = await db.select({
      id: users.id,
      email: users.email,
      full_name: users.full_name,
      avatar_url: users.avatar_url,
      created_at: users.created_at
    }).from(users).where(eq(users.id, session.user.id)).get();
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name } = (await req.json()) as any;
    const db = getDb();
    
    const result = await db.update(users)
      .set({ full_name: full_name || null })
      .where(eq(users.id, session.user.id))
      .run();

    if (result.meta?.changes === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, full_name });
  } catch (error) {
    console.error('Failed to update user profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
