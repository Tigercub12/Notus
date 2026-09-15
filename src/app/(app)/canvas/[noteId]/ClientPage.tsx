'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function CanvasPage() {
  const params = useParams();
  const router = useRouter();
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing canvas data
  useEffect(() => {
    if (!params.noteId) return;
    fetch(`/api/notes?id=${params.noteId}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data && data.canvas_image_url) {
          try {
            const parsed = JSON.parse(data.canvas_image_url);
            setInitialData(parsed);
          } catch (e) {
            console.error('Failed to parse canvas data', e);
          }
        }
      })
      .catch(err => console.error('Error loading note', err))
      .finally(() => setIsLoading(false));
  }, [params.noteId]);

  const handleSave = async () => {
    if (!excalidrawAPI || !params.noteId) {
      router.push(`/notes/${params.noteId}`);
      return;
    }
    
    setIsSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const files = excalidrawAPI.getFiles();
      const canvasData = JSON.stringify({ elements, files });
      
      await fetch(`/api/notes?id=${params.noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvas_image_url: canvasData // storing raw json in this text column
        }),
      });
      
      router.push(`/notes/${params.noteId}`);
    } catch (err) {
      console.error('Failed to save canvas', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex justify-between items-center px-4 h-14 bg-white border-b border-[#c4c5d5] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/notes/${params.noteId}`)} className="p-2 text-[#0b1c30] hover:bg-[#e5eeff] rounded-full transition-all -ml-2">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-semibold text-[#0b1c30]">แคนวาส</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1 bg-[#00288e] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#1e40af] transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          บันทึก
        </button>
      </header>

      {/* Canvas Area */}
      <div style={{ height: 'calc(100vh - 56px)' }} className="relative dot-grid-bg overflow-hidden w-full">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
          </div>
        ) : initialData !== null ? (
          <Excalidraw 
            theme="light" 
            initialData={initialData}
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)} 
          />
        ) : (
          <Excalidraw 
            theme="light" 
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)} 
          />
        )}
      </div>
    </div>
  );
}
