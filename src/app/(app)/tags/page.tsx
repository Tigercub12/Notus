'use client';

import { useState, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#00288e');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = (await res.json()) as any[];
        setTags(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      if (res.ok) {
        const newTag = (await res.json()) as any;
        setTags([newTag, ...tags]);
        setNewTagName('');
      } else {
        const err = (await res.json()) as any;
        alert(err.error || 'สร้างแท็กไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแท็กนี้? (หากลบ จะหายไปจากทุกโน้ตที่ติดแท็กนี้)')) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTags(tags.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-16 md:pb-0">
      <header className="px-6 h-16 flex items-center border-b border-[#c4c5d5] sticky top-0 bg-white z-10 shrink-0">
        <h1 className="text-2xl font-semibold text-[#0b1c30]">จัดการแท็ก</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {/* Create new tag */}
        <div className="bg-[#f8f9ff] border border-[#c4c5d5] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium text-[#0b1c30] mb-4">สร้างแท็กใหม่</h2>
          <form onSubmit={handleCreateTag} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium tracking-[0.05em] text-[#444653] mb-1">ชื่อแท็ก</label>
              <input 
                type="text" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="เช่น: สำคัญ, ไอเดีย"
                className="w-full bg-white border border-[#c4c5d5] rounded px-3 py-2 text-sm focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none"
                required
              />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium tracking-[0.05em] text-[#444653] mb-1">สีของแท็ก</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-10 p-1 bg-white border border-[#c4c5d5] rounded cursor-pointer"
                />
                <span className="text-sm font-mono text-[#757684]">{newTagColor}</span>
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-[#00288e] text-white px-6 py-2 rounded font-medium text-sm hover:bg-[#1e40af] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังสร้าง...' : 'สร้างแท็ก'}
            </button>
          </form>
        </div>

        {/* Tag list */}
        <div>
          <h2 className="text-lg font-medium text-[#0b1c30] mb-4">แท็กของคุณ</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#c4c5d5] rounded-xl text-[#757684]">
              <span className="material-symbols-outlined text-4xl mb-2">label_off</span>
              <p>ยังไม่มีแท็กใดๆ ลองสร้างแท็กแรกของคุณดูสิ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-4 border border-[#c4c5d5] rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                    <span className="font-medium text-[#0b1c30]">{tag.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-2 text-[#757684] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors"
                    title="ลบแท็ก"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
