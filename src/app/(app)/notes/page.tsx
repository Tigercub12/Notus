'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotePreview {
  id: string;
  title: string;
  content: string | null;
  is_pinned: number;
  updated_at: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<NotePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchNotes = () => {
    setIsLoading(true);
    const url = searchQuery.trim() ? `/api/notes?q=${encodeURIComponent(searchQuery)}` : '/api/notes';
    fetch(url)
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Failed: ${res.status} ${errText}`);
        }
        return (await res.json()) as any;
      })
      .then(data => setNotes(data))
      .catch(err => console.error('Failed to load notes:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle clicking outside to close menu
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', content: '' })
      });
      if (res.ok) {
        const note = await res.json();
        router.push(`/notes/${note.id}`);
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?')) return;
    
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== id));
      } else {
        alert('เกิดข้อผิดพลาดในการลบโน้ต');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleTogglePin = async (note: NotePreview, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    
    try {
      const newPinStatus = note.is_pinned === 1 ? 0 : 1;
      const res = await fetch(`/api/notes?id=${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: newPinStatus })
      });
      if (res.ok) {
        setNotes(notes.map(n => n.id === note.id ? { ...n, is_pinned: newPinStatus } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes;

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned === 1);
  const otherNotes = filteredNotes.filter((n) => n.is_pinned !== 1);

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 120);
  };

  const NoteCard = ({ note }: { note: NotePreview }) => {
    return (
      <div 
        onClick={() => router.push(`/notes/${note.id}`)}
        className="block relative bg-white border border-[#c4c5d5] rounded-lg p-4 hover:shadow-md hover:border-[#00288e]/20 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-sm font-semibold text-[#0b1c30] mb-1">{note.title || 'โน้ตไม่มีชื่อ'}</h3>
            <p className="text-sm text-[#444653] line-clamp-2">{stripHtml(note.content)}</p>
          </div>
          {note.is_pinned === 1 && (
            <span className="material-symbols-outlined text-[#00288e] text-[18px] ml-2 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-[#757684]">{new Date(note.updated_at).toLocaleDateString('th-TH')}</span>
          <div className="relative">
            <button 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                e.nativeEvent.stopImmediatePropagation();
                setOpenMenuId(openMenuId === note.id ? null : note.id); 
              }}
              className="p-1 text-[#757684] hover:bg-[#f8f9ff] rounded-full hover:text-[#0b1c30] transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
            
            {openMenuId === note.id && (
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-[#c4c5d5] rounded-lg shadow-lg overflow-hidden z-20">
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.nativeEvent.stopImmediatePropagation();
                    handleTogglePin(note, e); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#0b1c30] hover:bg-[#f8f9ff] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">{note.is_pinned === 1 ? 'do_not_disturb_on' : 'push_pin'}</span>
                  {note.is_pinned === 1 ? 'เลิกปักหมุด' : 'ปักหมุด'}
                </button>
                <button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.nativeEvent.stopImmediatePropagation();
                    handleDelete(note.id, e); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#ba1a1a] hover:bg-[#ffe5e5] flex items-center gap-2 border-t border-[#f8f9ff]"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  ลบโน้ต
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-white">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#f8f9ff] border-b border-[#c4c5d5] h-14 flex items-center justify-between px-4 sticky top-0 z-20">
        <h1 className="text-xl font-semibold text-[#0b1c30]">บันทึก</h1>
        <button onClick={handleNewNote} className="p-2 text-[#00288e] hover:bg-[#e5eeff] rounded-full">
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 h-16 border-b border-[#c4c5d5] bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-[#0b1c30]">บันทึกทั้งหมด</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#444653] text-sm">search</span>
            <input
              type="text"
              placeholder="ค้นหาบันทึก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-[#f8f9ff] rounded-full border-none focus:ring-2 focus:ring-[#00288e] text-sm text-[#0b1c30] placeholder:text-[#444653]"
            />
          </div>
          <button onClick={handleNewNote} className="flex items-center gap-2 bg-[#1e40af] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#00288e] transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            สร้างบันทึก
          </button>
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 max-w-4xl">
        {/* Search on mobile */}
        <div className="md:hidden mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#444653] text-sm">search</span>
            <input
              type="text"
              placeholder="ค้นหาบันทึก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] rounded-full border-none focus:ring-2 focus:ring-[#00288e] text-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
          </div>
        )}

        {/* Pinned Notes */}
        {!isLoading && pinnedNotes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
              ปักหมุด
            </h2>
            <div className="space-y-3">
              {pinnedNotes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {!isLoading && otherNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h2 className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase mb-3">อื่นๆ</h2>
            )}
            <div className="space-y-3">
              {otherNotes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredNotes.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-[#c4c5d5] mb-4">note_stack</span>
            <p className="text-sm text-[#444653] mb-4">ไม่พบบันทึก</p>
            <button onClick={handleNewNote} className="inline-flex items-center gap-2 bg-[#1e40af] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#00288e] transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
              สร้างบันทึกแรกของคุณ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const runtime = 'edge';
