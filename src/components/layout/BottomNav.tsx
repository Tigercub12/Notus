'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function BottomNav() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity" onClick={() => setShowMenu(false)}>
          <div 
            className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#c4c5d5]/30">
              <h3 className="text-[#0b1c30] font-semibold text-lg tracking-tight">เมนูเพิ่มเติม</h3>
            </div>
            
            <div className="flex flex-col py-2">
              <Link href="/files" onClick={() => setShowMenu(false)} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/files') ? 'bg-[#dde1ff] text-[#001453]' : 'hover:bg-[#f8f9ff]'}`}>
                <span className="material-symbols-outlined">folder</span>
                <span className="font-medium">ไฟล์</span>
              </Link>
              
              <Link href="/tags" onClick={() => setShowMenu(false)} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/tags') ? 'bg-[#dde1ff] text-[#001453]' : 'hover:bg-[#f8f9ff]'}`}>
                <span className="material-symbols-outlined">label</span>
                <span className="font-medium">แท็ก</span>
              </Link>
              
              <Link href="/settings" onClick={() => setShowMenu(false)} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${pathname.startsWith('/settings') ? 'bg-[#dde1ff] text-[#001453]' : 'hover:bg-[#f8f9ff]'}`}>
                <span className="material-symbols-outlined">settings</span>
                <span className="font-medium">ตั้งค่าระบบ</span>
              </Link>
            </div>
            
            <div className="p-2 border-t border-[#c4c5d5]/30">
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-3 text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded-lg transition-colors font-medium"
              >
                <span className="material-symbols-outlined">logout</span>
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-[#c4c5d5]/30 z-30 pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center h-16 px-2">
          <Link href="/dashboard" className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${pathname === '/dashboard' ? 'text-[#00288e] scale-110' : 'text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30]'}`}>
            <span className={`material-symbols-outlined text-[24px] ${pathname === '/dashboard' ? 'font-medium' : ''}`}>space_dashboard</span>
          </Link>
          <Link href="/notes" className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${pathname.startsWith('/notes') && pathname !== '/notes/new' ? 'text-[#00288e] scale-110' : 'text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30]'}`}>
            <span className={`material-symbols-outlined text-[24px] ${pathname.startsWith('/notes') && pathname !== '/notes/new' ? 'font-medium' : ''}`}>note_stack</span>
          </Link>
          
          <div className="relative -top-5">
            <Link href="/notes/new" className="flex items-center justify-center w-14 h-14 bg-[#00288e] text-white rounded-full shadow-[0px_4px_12px_rgba(0,40,142,0.3)] hover:bg-[#1e40af] hover:shadow-[0px_6px_16px_rgba(0,40,142,0.4)] transition-all duration-300 active:scale-95">
              <span className="material-symbols-outlined text-[28px]">add</span>
            </Link>
          </div>
          
          <Link href="/calendar" className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${pathname === '/calendar' ? 'text-[#00288e] scale-110' : 'text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30]'}`}>
            <span className={`material-symbols-outlined text-[24px] ${pathname === '/calendar' ? 'font-medium' : ''}`}>calendar_month</span>
          </Link>
          <button onClick={() => setShowMenu(!showMenu)} className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${showMenu ? 'text-[#00288e] scale-110' : 'text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30]'}`}>
            <span className={`material-symbols-outlined text-[24px] ${showMenu ? 'font-medium' : ''}`}>menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
