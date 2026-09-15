'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface DashboardData {
  noteCount: number;
  eventCount: number;
  tagCount: number;
  recentNotes: { id: string; title: string; updated_at: string }[];
  upcomingEvents: { id: string; title: string; event_date: string }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData>({
    noteCount: 0,
    eventCount: 0,
    tagCount: 0,
    recentNotes: [],
    upcomingEvents: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/notes').then(r => r.ok ? r.json() : []),
      fetch('/api/events?upcoming=true').then(r => r.ok ? r.json() : []),
      fetch('/api/tags').then(r => r.ok ? r.json() : []),
    ])
      .then(([notesData, eventsData, tagsData]) => {
        const notes = notesData as any[];
        const events = eventsData as any[];
        const tags = tagsData as any[];
        
        setData({
          noteCount: notes.length,
          eventCount: events.length,
          tagCount: tags.length,
          recentNotes: notes.slice(0, 5),
          upcomingEvents: events.slice(0, 5),
        });
      })
      .catch(err => console.error('Dashboard fetch error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'สวัสดีตอนเช้า' : now.getHours() < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  const dateStr = now.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'ผู้ใช้';

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 80);
  };

  return (
    <div className="min-h-full bg-white">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-[#f8f9ff] border-b border-[#c4c5d5] h-16 flex items-center justify-between px-4 w-full sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[#00288e]">Notus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-sm">
            {userName.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 max-w-5xl">
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-xs font-medium tracking-[0.05em] text-[#444653] mb-1">{dateStr}</p>
          <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#0b1c30]">{greeting}, {userName}</h1>
        </div>

        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Notes */}
          <div className="bg-white border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#00288e] text-[20px]">description</span>
              <span className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase">บันทึกทั้งหมด</span>
            </div>
            {isLoading ? (
              <div className="h-10 w-12 bg-[#e5eeff] rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-[32px] leading-[40px] font-bold text-[#0b1c30]">{data.noteCount}</p>
                <p className="text-xs font-medium tracking-[0.05em] text-[#444653] mt-1">
                  {data.noteCount > 0 ? `${data.noteCount} รายการ` : 'ยังไม่มีข้อมูล'}
                </p>
              </>
            )}
          </div>
          {/* Upcoming Events */}
          <div className="bg-white border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#00288e] text-[20px]">event</span>
              <span className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase">กิจกรรมที่กำลังจะมาถึง</span>
            </div>
            {isLoading ? (
              <div className="h-10 w-12 bg-[#e5eeff] rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-[32px] leading-[40px] font-bold text-[#0b1c30]">{data.eventCount}</p>
                <p className="text-xs font-medium tracking-[0.05em] text-[#444653] mt-1">
                  {data.eventCount > 0 ? 'มีกิจกรรมรออยู่' : 'ไม่มีกิจกรรมในเร็วๆ นี้'}
                </p>
              </>
            )}
          </div>
          {/* Active Tags */}
          <div className="bg-white border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#00288e] text-[20px]">label</span>
              <span className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase">แท็กที่ใช้งาน</span>
            </div>
            {isLoading ? (
              <div className="h-10 w-12 bg-[#e5eeff] rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-[32px] leading-[40px] font-bold text-[#0b1c30]">{data.tagCount}</p>
                <p className="text-xs font-medium tracking-[0.05em] text-[#444653] mt-1">
                  {data.tagCount > 0 ? `${data.tagCount} แท็ก` : 'ยังไม่มีแท็ก'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0b1c30]">บันทึกล่าสุด</h2>
            <Link href="/notes" className="text-xs font-medium tracking-[0.05em] text-[#00288e] hover:text-[#1e40af] transition-colors">ดูทั้งหมด</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-[#f8f9ff] rounded-lg animate-pulse"></div>)}
            </div>
          ) : data.recentNotes.length > 0 ? (
            <div className="space-y-3">
              {data.recentNotes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`} className="block border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md hover:border-[#00288e]/20 transition-all">
                  <h3 className="text-sm font-semibold text-[#0b1c30] mb-1">{note.title || 'โน้ตไม่มีชื่อ'}</h3>
                  <span className="text-[10px] text-[#757684]">{new Date(note.updated_at).toLocaleDateString('th-TH')}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-[#c4c5d5] rounded-lg bg-[#f8f9ff]">
              <span className="material-symbols-outlined text-[#c4c5d5] text-[32px] mb-2">description</span>
              <p className="text-sm text-[#444653]">ยังไม่มีบันทึก</p>
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0b1c30]">กำหนดการที่จะมาถึง</h2>
            <Link href="/calendar" className="text-xs font-medium tracking-[0.05em] text-[#00288e] hover:text-[#1e40af] transition-colors">ดูปฏิทิน</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-[#f8f9ff] rounded-lg animate-pulse"></div>)}
            </div>
          ) : data.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-[#dae2fd] rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-[#5c647a] uppercase">
                      {new Date(event.event_date).toLocaleDateString('th-TH', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-[#00288e] -mt-1">
                      {new Date(event.event_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0b1c30]">{event.title}</h3>
                    <span className="text-[10px] text-[#757684]">
                      {new Date(event.event_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-[#c4c5d5] rounded-lg bg-[#f8f9ff]">
              <span className="material-symbols-outlined text-[#c4c5d5] text-[32px] mb-2">event_busy</span>
              <p className="text-sm text-[#444653]">ยังไม่มีกำหนดการ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
