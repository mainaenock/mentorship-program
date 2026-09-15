import type { Role } from './contracts';
export function roleLinks(role: Role): { name: string; href: string }[] {
  if (role === 'guardian') return [{ name: 'Safeguarding', href: '/safeguarding' }];
  if (role === 'mentor') return [{ name: 'Application status', href: '/mentor/application/status/latest' }];
  if (role === 'minor') return [{ name: 'Safety and support', href: '/safeguarding' }];
  if (role !== 'member') return [{ name: 'Support information', href: '/help' }];
  return [];
}
