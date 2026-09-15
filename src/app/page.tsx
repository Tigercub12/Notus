'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      <span className="inline-block w-8 h-8 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></span>
    </div>
  );
}
