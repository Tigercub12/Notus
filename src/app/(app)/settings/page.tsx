'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = (await res.json()) as any;
        setProfile(data);
        setFullName(data.full_name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      });
      
      if (res.ok) {
        setMessage({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
        router.refresh(); // Refresh server components to reflect updated session
      } else {
        setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึก', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', type: 'error' });
    } finally {
      setIsSaving(false);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(prev => prev.type === 'success' ? { text: '', type: '' } : prev);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f8f9ff]">
        <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f8f9ff] pb-16 md:pb-0">
      <header className="px-6 h-16 flex items-center border-b border-[#c4c5d5] sticky top-0 bg-white z-10 shrink-0">
        <h1 className="text-2xl font-semibold text-[#0b1c30]">การตั้งค่า</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {/* Profile Settings */}
        <div className="bg-white border border-[#c4c5d5] rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-medium text-[#0b1c30] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">person</span>
            โปรไฟล์ส่วนตัว
          </h2>
          
          <form onSubmit={handleSave}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0b1c30] mb-1">อีเมล (บัญชีผู้ใช้)</label>
                <input 
                  type="email" 
                  value={profile?.email || ''} 
                  disabled
                  className="w-full bg-[#f8f9ff] border border-[#c4c5d5] rounded px-3 py-2 text-sm text-[#757684] cursor-not-allowed"
                />
                <p className="text-xs text-[#757684] mt-1">อีเมลที่ใช้ล็อกอิน ไม่สามารถเปลี่ยนได้</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#0b1c30] mb-1">ชื่อที่แสดงผล (Display Name)</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full bg-white border border-[#c4c5d5] rounded px-3 py-2 text-sm focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none transition-shadow"
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-[#dce9ff] text-[#00288e]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-4 border-t border-[#f8f9ff] flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving || fullName === profile?.full_name}
                  className="bg-[#00288e] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#1e40af] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Appearance Settings placeholder */}
        <div className="bg-white border border-[#c4c5d5] rounded-xl p-6 shadow-sm opacity-60">
          <h2 className="text-lg font-medium text-[#0b1c30] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">palette</span>
            การแสดงผล
          </h2>
          <p className="text-sm text-[#757684] mb-4">ฟีเจอร์ปรับแต่งธีม (Dark Mode) จะมาในอัปเดตหน้า</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <input type="radio" checked readOnly className="text-[#00288e]" />
              <span className="text-sm">สว่าง (Light)</span>
            </label>
            <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <input type="radio" disabled className="text-[#00288e]" />
              <span className="text-sm">มืด (Dark)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export const runtime = 'edge';
