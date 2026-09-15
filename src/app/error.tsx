'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: 'red' }}>A Server Error Occurred!</h2>
      <p><strong>Message:</strong> {error.message}</p>
      <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto' }}>
        <code>{error.stack}</code>
      </pre>
      <button onClick={() => reset()} style={{ padding: '8px 16px', background: '#00288e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  );
}
