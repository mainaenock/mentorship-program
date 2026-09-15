'use client';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 600, margin: '80px auto', padding: 24, fontFamily: 'Arial' }}>
          <h1>We couldn’t load the platform.</h1>
          <p>Please try again.</p>
          <button onClick={reset} style={{ padding: 15 }}>
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
