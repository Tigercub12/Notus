'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: 'red' }}>A Server Error Occurred!</h2>
          <p><strong>Message:</strong> {error.message}</p>
          <p><strong>Stack:</strong> {error.stack}</p>
          <p><strong>Digest:</strong> {error.digest}</p>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
