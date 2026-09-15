import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import AuthGuard from '@/components/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 hide-scrollbar">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
