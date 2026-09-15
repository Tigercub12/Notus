import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export const runtime = 'edge';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Double check if user still exists in DB
  const db = getDb();
  const dbUser = await db.select().from(users).where(eq(users.email, session.user.email)).get();
  
  if (!dbUser) {
    // Session is orphaned (DB was wiped), force them out
    redirect('/api/auth/signout?callbackUrl=/login');
  }

  return (
    <div className="flex h-screen bg-[#f8f9ff]">
      <Sidebar />
      <main className="flex-1 md:ml-[280px] h-full overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
