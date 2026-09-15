'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Compass, Menu, Moon, Sun, X } from 'lucide-react';
import { config, slug } from '../shared/config';
import { Button, Notice, useHydrated } from '../shared/ui';
export const navigation = ['How it works', 'Goals', 'Mentorship', 'Learning', 'Pricing', 'About'];
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">
        <Compass size={26} />
      </span>
      <span>
        {config.shortName}
        <small>A LITTLE PROGRESS, EVERY DAY</small>
      </span>
    </Link>
  );
}
export function Header() {
  const ready = useHydrated();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const value = localStorage.getItem('theme') === 'dark';
    setDark(value);
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
  }, []);
  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? 'dark' : 'light';
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map((item) => (
            <Link key={item} href={`/${slug(item)}`}>
              {item}
            </Link>
          ))}
        </nav>
        <div className="row header-actions">
          <button
            disabled={!ready}
            className="icon-button theme-toggle"
            aria-label="Toggle color theme"
            onClick={toggle}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link href="/login" className="login-link">
            Log in
          </Link>
          <Link href="/register" className="button primary desktop-cta">
            Get started <ArrowUpRight size={16} />
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button disabled={!ready} className="icon-button mobile-menu" aria-label="Open navigation">
                <Menu />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="overlay" />
              <Dialog.Content className="drawer">
                <Dialog.Title>Explore the platform</Dialog.Title>
                <Dialog.Description className="sr-only">Public pages and policies</Dialog.Description>
                <Dialog.Close className="icon-button dialog-close" aria-label="Close navigation">
                  <X />
                </Dialog.Close>
                <nav className="drawer-nav" aria-label="Mobile navigation">
                  {[
                    ...navigation,
                    'Become a mentor',
                    'Success stories',
                    'FAQ',
                    'Contact',
                    'Help',
                    ...config.policies,
                  ].map((item) => (
                    <Link key={item} onClick={() => setOpen(false)} href={`/${slug(item)}`}>
                      {item}
                    </Link>
                  ))}
                  <Link className="button primary" href="/register" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  const groups = {
    Platform: ['About', 'How it works', 'Goals', 'Pricing'],
    Programs: ['Learning', 'Success stories'],
    Mentorship: ['Mentorship', 'Become a mentor', 'Safeguarding'],
    Support: ['Help', 'FAQ', 'Accessibility'],
    Contact: ['Contact'],
    Legal: config.policies.filter((item) => !['Accessibility', 'Safeguarding'].includes(item)),
  };
  return (
    <footer>
      <div className="container footer-top">
        <div>
          <Brand />
          <p>
            Meaningful goals.
            <br />
            Steady progress. Shared success.
          </p>
          <span className="eyebrow">Built for your next chapter.</span>
        </div>
        {Object.entries(groups).map(([title, links]) => (
          <div key={title}>
            <h3>{title}</h3>
            {links.map((item) => (
              <Link key={item} href={`/${slug(item)}`}>
                {item}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} {config.name}
        </span>
        <span>
          {new Intl.DisplayNames([config.locale], { type: 'region' }).of(config.country)} ·{' '}
          {config.languages[0]} · {config.currency === 'KES' ? 'KSh' : config.currency}
        </span>
        {config.socialLinks.map((link) => (
          <a key={link.name} href={link.href} rel="noreferrer">
            {link.name}
          </a>
        ))}
      </div>
    </footer>
  );
}
export function RuntimeControls() {
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production')
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (reg.waiting) setUpdate(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdate(worker);
            });
          });
        })
        .catch(() => {});
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  return (
    <>
      {offline && (
        <div className="runtime-banner">
          <Notice>You’re offline. Reconnect before submitting forms.</Notice>
        </div>
      )}
      {update && (
        <div className="runtime-banner">
          <Notice>
            An update is ready. Save your progress before reloading.{' '}
            <Button
              onClick={() => {
                navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
                  once: true,
                });
                update.postMessage('SKIP_WAITING');
              }}
            >
              Update now
            </Button>
          </Notice>
        </div>
      )}
    </>
  );
}
