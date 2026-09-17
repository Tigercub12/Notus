'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navLinks = [
  { href: '/dashboard', icon: 'home', label: 'หน้าแรก' },
  { href: '/notes', icon: 'description', label: 'บันทึก' },
  { href: '/calendar', icon: 'calendar_today', label: 'ปฏิทิน' },
  { href: '/tags', icon: 'label', label: 'แท็ก' },
  { href: '/files', icon: 'folder_open', label: 'ไฟล์' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'ผู้ใช้';
  const userEmail = session?.user?.email || '';

  const handleNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', content: '' })
      });
      if (res.ok) {
        const note = (await res.json()) as any;
        router.push(`/notes/${note.id}`);
      }
    } catch (e) {}
  };

  return (
    <nav className="hidden md:flex flex-col h-full w-[280px] bg-[#f8f9ff] border-r border-[#c4c5d5] shrink-0 z-10 pb-4">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#c4c5d5] mb-4">
        <span className="text-xl font-bold text-[#00288e]">Notus</span>
        <span className="ml-2 text-xs font-medium tracking-[0.05em] text-[#444653] mt-1">ความแม่นยำระดับผู้บริหาร</span>
      </div>

      {/* CTA */}
      <div className="px-4 mb-6">
        <button onClick={handleNewNote} className="w-full flex items-center justify-center gap-2 bg-[#1e40af] text-white hover:bg-[#00288e] transition-colors py-3 rounded-xl shadow-sm hover:shadow-md text-xs font-medium tracking-[0.05em]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
          โน้ตใหม่
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-[#dae2fd] text-[#00288e] font-medium border-l-4 border-[#00288e]'
                  : 'text-[#444653] hover:bg-[#e5eeff]'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Settings & User */}
      <div className="mt-auto px-4 pt-4 border-t border-[#c4c5d5] space-y-2">
        <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm rounded-lg ${
          pathname === '/settings' ? 'bg-[#dae2fd] text-[#00288e] font-medium' : 'text-[#444653] hover:bg-[#e5eeff]'
        }`}>
          <span className="material-symbols-outlined" style={pathname === '/settings' ? { fontVariationSettings: "'FILL' 1" } : undefined}>settings</span>
          การตั้งค่า
        </Link>
        
        {/* User Profile Card */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-[#c4c5d5]">
          <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0b1c30] truncate">{userName}</p>
            <p className="text-[10px] text-[#757684] truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 text-[#757684] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
            title="ออกจากระบบ"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
