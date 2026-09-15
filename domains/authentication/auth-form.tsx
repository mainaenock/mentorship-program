'use client';
import { SafeForm } from '../shared/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth, readSession, saveSession } from '../shared/demo-services';
import { Button, Field, Notice, Password } from '../shared/ui';
export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.').max(128, 'Use no more than 128 characters.'),
});
export function AuthForm({ mode }: { mode: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [editing, setEditing] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof credentialsSchema>>({ resolver: zodResolver(credentialsSchema) });
  useEffect(() => {
    if (!cooldown) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const verify = mode.startsWith('verify');
  const title =
    mode === 'register'
      ? 'Your next chapter starts here.'
      : mode === 'login'
        ? 'Welcome back.'
        : verify
          ? 'Let’s verify your contact.'
          : mode === 'forgot-password'
            ? 'Let’s get you back in.'
            : 'Choose a new password.';
  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <span className="eyebrow">ONE SMALL STEP</span>
        <h2>
          A little intention.
          <br />A little support.
          <br />
          <em>A lot of possibility.</em>
        </h2>
        <p>
          Your journey is yours to shape.
          <br />
          We’re here to help you move forward.
        </p>
        <div className="auth-decoration">↗</div>
      </aside>
      <div className="auth-form">
        <span className="eyebrow">{mode === 'register' ? 'GET STARTED' : 'YOUR ACCOUNT'}</span>
        <h1>{title}</h1>
        <p>
          {mode === 'register'
            ? 'Create your account, then take it one step at a time.'
            : 'Continue towards something that matters.'}
        </p>
        <Notice>
          Development demo: no real account is created. Use fictional details. Verification code:{' '}
          <strong>123456</strong>.
        </Notice>
        {params.get('reason') === 'expired' && (
          <Notice error>Your session expired. Log in again to continue.</Notice>
        )}
        {['login', 'register'].includes(mode) ? (
          <SafeForm
            className="form-stack"
            onSubmit={handleSubmit((values) =>
              run(async () => {
                if (mode === 'register') {
                  await auth.register(values.email, values.password);
                  const plan = params.get('plan');
                  if (plan) sessionStorage.setItem('gap-plan', plan);
                  router.push('/verify-email');
                } else {
                  await auth.login(values.email, values.password);
                  router.push('/onboarding');
                }
              }),
            )}
          >
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Password
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <span className="field-error" role="alert">
                {errors.password.message}
              </span>
            )}
            {mode === 'register' && (
              <p className="small">
                Use at least 10 characters. You’ll review the <Link href="/terms">Terms</Link> and{' '}
                <Link href="/privacy">Privacy Policy</Link> during setup.
              </p>
            )}
            {mode === 'login' && (
              <Link className="text-link" href="/forgot-password">
                Forgot password?
              </Link>
            )}
            <Button loading={busy} type="submit">
              {mode === 'register' ? 'Create account' : 'Log in'}
            </Button>
            <p>
              {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
              <Link href={mode === 'register' ? '/login' : '/register'}>
                {mode === 'register' ? 'Log in' : 'Create account'}
              </Link>
            </p>
          </SafeForm>
        ) : verify ? (
          <>
            <SafeForm
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const values = new FormData(e.currentTarget);
                void run(async () => {
                  if (mode === 'verify-phone') {
                    const current = readSession();
                    if (current) saveSession({ ...current, phone: String(values.get('phone')) });
                  }
                  await auth.verify(String(values.get('code')));
                  router.push('/onboarding');
                });
              }}
            >
              {mode === 'verify-phone' && (
                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+254 712 345 678"
                  pattern="\+?[0-9 ()-]{9,20}"
                  required
                />
              )}
              <Field
                label="Six-digit verification code"
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                maxLength={6}
              />
              <Button loading={busy} type="submit">
                Verify and continue
              </Button>
            </SafeForm>
            <div className="actions">
              <Button
                variant="ghost"
                disabled={cooldown > 0 || busy}
                onClick={() =>
                  void run(async () => {
                    await auth.resend();
                    setCooldown(30);
                    setMessage('Demo code reset to 123456. No email or SMS was sent.');
                  })
                }
              >
                {cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(!editing)}>
                Change email/phone
              </Button>
            </div>
            {editing && (
              <SafeForm
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const current = readSession();
                  if (!current) {
                    setError('Create an account first.');
                    return;
                  }
                  const address = String(new FormData(e.currentTarget).get('contact'));
                  saveSession({
                    ...current,
                    ...(mode === 'verify-phone' ? { phone: address } : { email: address }),
                    status: 'unverified',
                  });
                  setEditing(false);
                  setMessage('Demo contact updated. Enter the verification code to continue.');
                }}
              >
                <Field
                  label={mode === 'verify-phone' ? 'New phone number' : 'New email address'}
                  name="contact"
                  type={mode === 'verify-phone' ? 'tel' : 'email'}
                  required
                />
                <Button type="submit">Update contact</Button>
              </SafeForm>
            )}
            <Link href={mode === 'verify-email' ? '/verify-phone' : '/verify-email'}>
              Use {mode === 'verify-email' ? 'phone' : 'email'} verification
            </Link>
          </>
        ) : (
          <SafeForm
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              void run(async () => {
                if (mode === 'forgot-password') {
                  await auth.recover(String(values.get('email')));
                  setMessage(
                    'If an account matches this address, password recovery instructions will be sent. This demo does not deliver email.',
                  );
                } else {
                  if (values.get('password') !== values.get('confirm'))
                    throw new Error('The passwords do not match.');
                  await auth.reset(params.get('token') || '', String(values.get('password')));
                  setMessage('Demo reset completed. You can now return to login.');
                }
              });
            }}
          >
            {mode === 'forgot-password' ? (
              <Field label="Email address" type="email" name="email" autoComplete="email" required />
            ) : (
              <>
                <Password
                  name="password"
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <Password
                  label="Confirm password"
                  name="confirm"
                  minLength={10}
                  autoComplete="new-password"
                  required
                />
              </>
            )}
            <Button loading={busy} type="submit">
              {mode === 'forgot-password' ? 'Send recovery instructions' : 'Reset password'}
            </Button>
            <Link href="/login">Back to login</Link>
          </SafeForm>
        )}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
      </div>
    </div>
  );
}
