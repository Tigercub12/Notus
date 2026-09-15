'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [outline, setOutline] = useState<{ level: number, text: string }[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);

  // Sync title for stale closures in onUpdate
  const titleRef = useRef(title);
  useEffect(() => { titleRef.current = title; }, [title]);

  // Sync isPinned for stale closures
  const isPinnedRef = useRef(isPinned);
  useEffect(() => { isPinnedRef.current = isPinned; }, [isPinned]);
  
  // Create a ref for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [tags, setTags] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');

  const saveNote = async (currentTitle: string, currentContent: string, isAutoSave = false, pinState?: boolean) => {
    if (!params.id) return;
    try {
      if (!isAutoSave) setIsSaving(true);
      await fetch(`/api/notes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: currentTitle, 
          content: currentContent,
          is_pinned: pinState !== undefined ? pinState : isPinned 
        })
      });
      if (!isAutoSave) router.refresh();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?')) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/notes/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/notes');
        router.refresh();
      } else {
        alert('ลบโน้ตไม่สำเร็จ');
        setIsSaving(false);
      }
    } catch (err) {
      console.error(err);
      alert('ลบโน้ตไม่สำเร็จ');
      setIsSaving(false);
    }
  };

  const debouncedSave = (newTitle: string, newContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newTitle, newContent, true);
    }, 1000);
  };

  const parseOutline = (ed: any) => {
    const json = ed.getJSON();
    const headings: { level: number, text: string }[] = [];
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'heading') {
          headings.push({
            level: node.attrs?.level || 1,
            text: node.content?.map((c:any) => c.text).join('') || 'Untitled'
          });
        }
        if (node.content) traverse(node.content);
      });
    };
    if (json.content) traverse(json.content);
    setOutline(headings);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: 'เริ่มเขียนบันทึกของคุณ...' })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none text-[#444653]',
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(titleRef.current, editor.getHTML());
      parseOutline(editor);
    },
  });

  // Load note data
  useEffect(() => {
    if (!params.id || !editor) return;

    fetch(`/api/notes/${params.id}`)
      .then(async res => {
        if (!res.ok) throw new Error('Not found');
        return (await res.json()) as any;
      })
      .then(data => {
        setTitle(data.title || '');
        setIsPinned(data.is_pinned === 1);
        if (data.content) {
          editor.commands.setContent(data.content, { emitUpdate: false });
          parseOutline(editor);
        } else {
          editor.commands.setContent('', { emitUpdate: false });
        }
      })
      .catch(err => {
        // Assume new note
        setTitle('');
        editor.commands.setContent('', { emitUpdate: false });
      })
      .finally(() => setIsLoading(false));

    // Load tags
    fetch(`/api/notes/${params.id}/tags`)
      .then(async res => res.ok ? (await res.json()) as any : [])
      .then(data => setTags(data || []))
      .catch(err => console.error('Failed to load tags', err));

    // Load related events
    fetch(`/api/events?note_id=${params.id}`)
      .then(async res => res.ok ? (await res.json()) as any : [])
      .then(data => setRelatedEvents(data || []))
      .catch(err => console.error('Failed to load events', err));
  }, [params.id, editor]);

  const handleTagSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      try {
        const res = await fetch(`/api/notes/${params.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagInput })
        });
        if (res.ok) {
          const newTag = (await res.json()) as any;
          setTags(prev => [...prev.filter(t => t.id !== newTag.id), newTag]);
          setTagInput('');
        }
      } catch (err) {
        console.error('Failed to add tag', err);
      }
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      await fetch(`/api/notes/${params.id}/tags/${tagId}`, { method: 'DELETE' });
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (err) {
      console.error('Failed to remove tag', err);
    }
  };

  const toolbarButtons = [
    { icon: 'undo', title: 'เลิกทำ', action: () => editor?.chain().focus().undo().run(), disabled: !editor?.can().undo() },
    { icon: 'redo', title: 'ทำซ้ำ', action: () => editor?.chain().focus().redo().run(), disabled: !editor?.can().redo() },
    { divider: true },
    { icon: 'format_bold', title: 'ตัวหนา', action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
    { icon: 'format_italic', title: 'ตัวเอียง', action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
    { icon: 'strikethrough_s', title: 'ขีดฆ่า', action: () => editor?.chain().focus().toggleStrike().run(), active: editor?.isActive('strike') },
    { icon: 'code', title: 'โค้ดอินไลน์', action: () => editor?.chain().focus().toggleCode().run(), active: editor?.isActive('code') },
    { divider: true },
    { icon: 'format_h1', title: 'หัวข้อ 1', action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive('heading', { level: 1 }) },
    { icon: 'format_h2', title: 'หัวข้อ 2', action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }) },
    { icon: 'format_quote', title: 'คำคม', action: () => editor?.chain().focus().toggleBlockquote().run(), active: editor?.isActive('blockquote') },
    { divider: true },
    { icon: 'format_list_bulleted', title: 'รายการสัญลักษณ์', action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
    { icon: 'format_list_numbered', title: 'รายการตัวเลข', action: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive('orderedList') },
    { icon: 'data_object', title: 'บล็อกโค้ด', action: () => editor?.chain().focus().toggleCodeBlock().run(), active: editor?.isActive('codeBlock') },
    { icon: 'horizontal_rule', title: 'เส้นคั่น', action: () => editor?.chain().focus().setHorizontalRule().run() },
  ];

  return (
    <div className="flex flex-col h-full relative bg-white pb-16 md:pb-0">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-4 h-14 bg-white border-b border-[#c4c5d5] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Link href="/notes" className="p-2 text-[#0b1c30] hover:bg-[#e5eeff] rounded-full transition-all -ml-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex items-center gap-1 text-[#444653]">
            <span className="text-xs font-medium tracking-[0.05em]">โน้ตของฉัน</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-xs font-medium tracking-[0.05em] text-[#00288e] truncate max-w-[150px]">
              {title || 'โน้ตใหม่'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#444653]">
          <button 
            onClick={() => saveNote(title, editor?.getHTML() || '')}
            disabled={isSaving}
            className="flex items-center gap-1 bg-[#00288e] text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-50 mr-1"
          >
            {isSaving ? (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            บันทึก
          </button>
          <button 
            onClick={handleDeleteNote}
            className="hover:bg-[#ffe5e5] text-[#b91c1c] rounded-full p-2 transition-all duration-200 flex items-center justify-center" 
            title="ลบโน้ต"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </header>

      {/* Editor Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto scroll-smooth relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
          </div>
        )}
        {/* Rich Text Toolbar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#c4c5d5] p-2 flex items-center z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1 bg-[#f8f9ff] rounded-lg p-1 border border-[#c4c5d5]/50 flex-nowrap shrink-0">
            {toolbarButtons.map((btn, i) => {
              if ('divider' in btn) return <div key={i} className="w-[1px] h-5 bg-[#c4c5d5] mx-1"></div>;
              return (
                <button 
                  key={i} 
                  onClick={btn.action}
                  disabled={btn.disabled}
                  className={`p-2 rounded transition-colors ${btn.active ? 'bg-[#c4c5d5] text-[#00288e]' : 'text-[#0b1c30] hover:bg-[#dce9ff]'} disabled:opacity-30 disabled:cursor-not-allowed`} 
                  title={btn.title}
                >
                  <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Inner */}
        <div className="w-full mx-auto px-4 py-6 flex-1 relative">
          <div className="relative z-10 pb-8 border-b border-[#c4c5d5]/30">
            {/* Title */}
            <input
              className="w-full bg-transparent text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#0b1c30] border-none focus:ring-0 p-0 mb-6 placeholder:text-[#c4c5d5]"
              placeholder="หัวข้อโน้ต..."
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                debouncedSave(e.target.value, editor?.getHTML() || '');
              }}
            />

            {/* Content */}
            <div className="editor-content min-h-[200px]">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Properties Section */}
          <div className="relative z-10 py-6">
            <h3 className="text-xl font-semibold text-[#0b1c30] mb-6">คุณสมบัติ</h3>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[#444653]">
                <span className="material-symbols-outlined text-[20px]">push_pin</span>
                <span className="text-sm">ปักหมุดโน้ต</span>
              </div>
              <button
                onClick={() => {
                  const newPinned = !isPinned;
                  setIsPinned(newPinned);
                  saveNote(title, editor?.getHTML() || '', false, newPinned);
                }}
                className={`w-10 h-5 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-1 ${isPinned ? 'bg-[#00288e]' : 'bg-[#c4c5d5]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isPinned ? 'left-1 translate-x-5' : 'left-1'}`}></div>
              </button>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-[#444653] mb-2">
                <span className="material-symbols-outlined text-[20px]">label</span>
                <span className="text-xs font-medium tracking-[0.05em] uppercase">แท็ก</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: tag.color || '#e5eeff', color: '#00288e' }}>
                    <span>{tag.name}</span>
                    <button onClick={() => removeTag(tag.id)} className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <input 
                className="w-full bg-white border border-[#c4c5d5] rounded px-3 py-2 text-sm focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] placeholder:text-[#757684]" 
                placeholder="เพิ่มแท็ก... (กด Enter เพื่อเพิ่ม)" 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagSubmit}
              />
            </div>

            {/* Related Event */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-[#444653] mb-2">
                <span className="material-symbols-outlined text-[20px]">event</span>
                <span className="text-xs font-medium tracking-[0.05em] uppercase">กิจกรรมที่เกี่ยวข้อง</span>
              </label>
              {relatedEvents.length > 0 ? (
                <div className="space-y-2">
                  {relatedEvents.map(event => (
                    <div key={event.id} className="flex flex-col p-2 bg-[#f8f9ff] border border-[#c4c5d5] rounded">
                      <span className="text-sm font-medium text-[#0b1c30]">{event.title}</span>
                      <span className="text-xs text-[#757684]">
                        {new Date(event.event_date).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full flex items-center justify-center px-3 py-4 bg-white border border-[#c4c5d5] border-dashed rounded text-center">
                  <span className="text-xs text-[#757684]">ยังไม่มีกิจกรรมที่เกี่ยวข้อง</span>
                </div>
              )}
            </div>

            {/* Outline */}
            <div>
              <h3 className="text-xl font-semibold text-[#0b1c30] mb-4">โครงร่าง</h3>
              <div className="border-l-2 border-[#c4c5d5]/30 pl-3 pb-8">
                {outline.length > 0 ? (
                  <ul className="space-y-2">
                    {outline.map((h, i) => (
                      <li key={i} className={`text-sm ${h.level === 1 ? 'font-medium text-[#0b1c30]' : h.level === 2 ? 'pl-3 text-[#444653]' : 'pl-6 text-[#757684]'}`}>
                        <a href="#" className="hover:text-[#00288e] transition-colors">{h.text}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-[#757684]">ไม่มีข้อมูลโครงร่าง</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Mode FAB */}
        <Link
          href={`/canvas/${params.id}`}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-[#00288e] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1e40af] transition-all active:scale-95 md:bottom-8 md:right-8"
        >
          <span className="material-symbols-outlined text-[28px]">palette</span>
        </Link>
      </div>
    </div>
  );
}
