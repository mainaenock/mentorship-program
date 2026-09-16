'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Bell, CircleHelp, Compass, Menu as MenuIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { auth, readSession } from '../shared/demo-services';
import { canEnter, type Session } from '../shared/contracts';
import { Button, Menu, Modal, Notice, Skeleton } from '../shared/ui';
import { Breadcrumbs, SearchPalette } from '../shared/composites';
import { config } from '../shared/config';
import { hasPermission, portalHome } from './permissions';
import { matchPortalRoute, primaryNavigation, visibleRoutes } from './routes';

export function PortalShell({
  path,
  children,
  action,
}: {
  path: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const check = () => {
      const current = readSession();
      if (!current || current.expiresAt <= Date.now()) {
        setSession(null);
        router.replace('/login?reason=expired');
      } else if (!canEnter(current)) {
        setSession(null);
        router.replace(current.status === 'guardian_pending' ? '/onboarding' : '/account-status');
      } else setSession(current);
    };
    check();
    setCollapsed(localStorage.getItem('gap-sidebar') === 'collapsed');
    const timer = setInterval(check, 15000);
    window.addEventListener('session-change', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('session-change', check);
    };
  }, [router]);
  if (!session)
    return (
      <div className="container page-content">
        <Skeleton />
      </div>
    );
  const route = matchPortalRoute(path);
  if (!route || !hasPermission(session, route.permission))
    return (
      <div className="form-page">
        <h1>This space needs permission.</h1>
        <Notice>Your account cannot access this page.</Notice>
        <Link className="button primary" href={portalHome(session.role)}>
          Return to your workspace
        </Link>
      </div>
    );
  const routes = visibleRoutes(session);
  const primary = primaryNavigation(session.role).filter((item) => {
    const match = matchPortalRoute(item.href);
    return !!match && hasPermission(session, match.permission);
  });
  const home = portalHome(session.role);
  const notificationPath =
    home === '/mentor'
      ? '/mentor/messages'
      : home === '/admin'
        ? routes.find((item) => item.path === '/admin/engagement/notifications')?.path || '/admin/support'
        : `${home}/notifications`;
  const secondary = (
    <nav aria-label="All workspace destinations" className="portal-links">
      {Array.from(new Set(routes.map((item) => item.group))).map((group) => (
        <div key={group}>
          <h3>{group}</h3>
          {routes
            .filter((item) => item.group === group)
            .map((item) => (
              <Link key={item.path} href={item.path} aria-current={path === item.path ? 'page' : undefined}>
                {item.title}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
  async function logout() {
    try {
      await auth.logout();
      router.replace('/login');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className={`portal-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="portal-sidebar">
        <Link className="brand" href={home}>
          <Compass size={28} />
          <span>{config.shortName}</span>
        </Link>
        <Button
          variant="ghost"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => {
            localStorage.setItem('gap-sidebar', collapsed ? 'expanded' : 'collapsed');
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        {!collapsed && secondary}
      </aside>
      <div className="portal-body">
        <header className="portal-topbar">
          <Link className="portal-mobile-brand" href={home}>
            <Compass aria-label={config.shortName} />
          </Link>
          <SearchPalette items={routes.map((item) => ({ label: item.title, href: item.path }))} />
          <div className="portal-top-actions">
            {routes.some((item) => item.path === notificationPath) && (
              <Link className="button ghost icon-button" aria-label="Notifications" href={notificationPath}>
                <Bell size={20} />
              </Link>
            )}
            <Link
              className="button ghost icon-button"
              aria-label="Help"
              href={home === '/app' ? '/app/help' : '/help'}
            >
              <CircleHelp size={20} />
            </Link>
            <Menu
              trigger={
                <Button variant="ghost" aria-label="User menu">
                  Account
                </Button>
              }
              items={[
                ...(routes.some((item) => item.path === `${home}/profile`)
                  ? [{ label: 'Profile', action: () => router.push(`${home}/profile`) }]
                  : []),
                {
                  label: 'Log out',
                  action: () => {
                    void logout();
                  },
                },
              ]}
            />
            <Modal
              title="More destinations"
              drawer
              trigger={
                <Button variant="ghost" aria-label="More destinations">
                  <MenuIcon size={20} />
                </Button>
              }
            >
              {secondary}
            </Modal>
          </div>
        </header>
        <div className="portal-content">
          <p className="portal-demo">Demonstration workspace · data stays in this browser tab</p>
          <Breadcrumbs
            items={[
              { label: 'Workspace', href: home },
              ...(path === home ? [] : [{ label: route.group }, { label: route.title }]),
            ]}
          />
          <div className="portal-heading">
            <div>
              <span className="eyebrow">{session.role.replaceAll('_', ' ')}</span>
              <h1>{route.title}</h1>
            </div>
            {action}
          </div>
          {error && <Notice error>{error}</Notice>}
          {children}
        </div>
      </div>
      <nav className="portal-bottom" aria-label="Mobile workspace navigation">
        {primary.map((item) => (
          <Link key={item.href} href={item.href} aria-current={path === item.href ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
        {home === '/admin' && (
          <Modal title="More destinations" drawer trigger={<Button variant="ghost">More</Button>}>
            {secondary}
          </Modal>
        )}
      </nav>
    </div>
  );
}
