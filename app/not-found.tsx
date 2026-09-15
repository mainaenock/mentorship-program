import { ActionLink } from '../domains/shared/ui';
export default function NotFound() {
  return (
    <div className="form-page">
      <span className="eyebrow">404 · A DIFFERENT PATH</span>
      <h1>That page isn’t here.</h1>
      <p>Let’s get you back to your next step.</p>
      <ActionLink href="/">Back to home</ActionLink>
    </div>
  );
}
