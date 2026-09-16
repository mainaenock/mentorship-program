'use client';
import { useEffect, useState } from 'react';
import { Button } from '../domains/shared/ui';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return (
    <div className="form-page">
      <h1>{offline ? 'A short pause in your journey.' : 'Something interrupted this step.'}</h1>
      <p>
        {offline
          ? 'You’re offline. Reconnect to continue. Private workspace data is not cached for offline access.'
          : 'Please try again. If the problem continues, contact support.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
