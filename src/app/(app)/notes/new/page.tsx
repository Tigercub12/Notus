'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewNotePage() {
  const router = useRouter();
  useEffect(() => {
    const createNote = async () => {
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '', content: '' })
        });
        if (res.ok) {
          const note = (await res.json()) as any;
          router.replace(`/notes/${note.id}`);
        } else {
          // fallback
          router.replace('/notes');
        }
      } catch (err) {
        console.error(err);
        router.replace('/notes');
      }
    };
    createNote();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <span className="inline-block w-6 h-6 border-2 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
    </div>
  );
}
