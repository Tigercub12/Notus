'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Attachment {
  id: string;
  note_id: string;
  r2_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  note_title: string;
}

interface Note {
  id: string;
  title: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedNote, setSelectedNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes'); // Re-using notes endpoint to get list
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchNotes();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedNote) {
      alert('กรุณาเลือกโน้ตที่ต้องการแนบไฟล์');
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('note_id', selectedNote);
    
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const newFile = (await res.json()) as any;
        const note = notes.find(n => n.id === selectedNote);
        newFile.note_title = note?.title || 'โน้ตไม่มีชื่อ';
        setFiles([newFile, ...files]);
      } else {
        const err = (await res.json()) as any;
        alert(err.error || 'การอัปโหลดล้มเหลว');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (r2Key: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) return;
    try {
      const res = await fetch(`/api/files/${r2Key}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.r2_key !== r2Key));
      } else {
        alert('ลบไฟล์ไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบไฟล์');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9ff] pb-16 md:pb-0">
      <header className="px-6 h-16 flex items-center border-b border-[#c4c5d5] sticky top-0 bg-white z-10 shrink-0">
        <h1 className="text-2xl font-semibold text-[#0b1c30]">ไฟล์ทั้งหมด</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        {/* Upload Section */}
        <div className="bg-white border border-[#c4c5d5] rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-[#0b1c30] mb-4">อัปโหลดไฟล์ใหม่</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium tracking-[0.05em] text-[#444653] mb-1">เลือกโน้ตที่จะแนบไฟล์</label>
              <select 
                value={selectedNote}
                onChange={(e) => setSelectedNote(e.target.value)}
                className="w-full bg-white border border-[#c4c5d5] rounded px-3 py-2 text-sm focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none"
              >
                <option value="">-- เลือกโน้ต --</option>
                {notes.map(note => (
                  <option key={note.id} value={note.id}>{note.title || 'โน้ตไม่มีชื่อ'}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full relative">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading || notes.length === 0}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-lg px-4 py-4 text-sm font-medium transition-colors ${
                  isUploading ? 'bg-[#f8f9ff] text-[#757684] border-[#c4c5d5] cursor-not-allowed' : 'bg-[#e5eeff] text-[#00288e] border-[#3755c3] hover:bg-[#dce9ff] cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">cloud_upload</span>
                    คลิกเพื่อเลือกไฟล์อัปโหลด
                  </>
                )}
              </label>
            </div>
          </div>
          {notes.length === 0 && !isLoading && (
            <p className="text-xs text-[#ba1a1a] mt-2">คุณต้องสร้างโน้ตอย่างน้อย 1 รายการก่อนจึงจะอัปโหลดไฟล์ได้</p>
          )}
        </div>

        {/* Files Grid */}
        <div>
          <h2 className="text-lg font-medium text-[#0b1c30] mb-4">ไฟล์ที่ถูกแนบไว้</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-[#c4c5d5] rounded-xl text-[#757684]">
              <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
              <p>ยังไม่มีไฟล์ถูกแนบในโน้ตใดๆ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map(file => (
                <div key={file.id} className="bg-white border border-[#c4c5d5] rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  {/* Preview placeholder */}
                  <div className="h-32 bg-[#e5eeff] flex items-center justify-center text-[#3755c3]">
                    <span className="material-symbols-outlined text-4xl">
                      {file.mime_type.startsWith('image/') ? 'image' : 
                       file.mime_type.startsWith('video/') ? 'movie' : 
                       file.mime_type.includes('pdf') ? 'picture_as_pdf' : 'insert_drive_file'}
                    </span>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-medium text-[#0b1c30] truncate mb-1" title={file.file_name}>{file.file_name}</h3>
                    <div className="text-xs text-[#757684] flex items-center justify-between mb-3">
                      <span>{formatSize(file.size_bytes)}</span>
                      <span>{new Date(file.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-[#f8f9ff] flex items-center justify-between">
                      <div className="text-xs text-[#444653] flex items-center gap-1 truncate pr-2">
                        <span className="material-symbols-outlined text-[14px]">description</span>
                        <Link href={`/notes/${file.note_id}`} className="hover:text-[#00288e] hover:underline truncate">
                          {file.note_title || 'โน้ตไม่มีชื่อ'}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`/api/files/${file.r2_key}`}
                          download
                          className="text-[#00288e] hover:text-[#001453]"
                          title="ดาวน์โหลด"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.r2_key)}
                          className="text-[#b91c1c] hover:bg-[#ffe5e5] rounded p-1 transition-colors flex items-center"
                          title="ลบไฟล์"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
