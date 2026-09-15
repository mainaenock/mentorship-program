'use client';
import { Button } from '../domains/shared/ui';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="form-page">
      <h1>Something interrupted this step.</h1>
      <p>Please try again. If the problem continues, contact support.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
