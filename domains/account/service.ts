'use client';
import { canEnter } from '../shared/contracts';
import { readSession } from '../shared/demo-services';
export interface Profile {
  displayName: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  biography: string;
}
export interface Preferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  reminders: boolean;
  achievementsPublic: boolean;
  analytics: boolean;
}
export interface AccountNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  read: boolean;
  createdAt: string;
}
export interface AccountRequest {
  id: string;
  kind: 'Support' | 'Privacy' | 'Security';
  subject: string;
  detail: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
}
export interface AccountData {
  profile: Profile;
  preferences: Preferences;
  notifications: AccountNotification[];
  requests: AccountRequest[];
}
export interface AccountService {
  read(): Promise<AccountData>;
  saveProfile(profile: Profile): Promise<AccountData>;
  savePreferences(preferences: Preferences): Promise<AccountData>;
  markRead(id?: string): Promise<AccountData>;
  request(kind: AccountRequest['kind'], subject: string, detail: string): Promise<AccountData>;
}
async function key() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. Reconnect before saving.');
  const session = readSession();
  if (!canEnter(session) || !session) throw new Error('Sign in with an active account.');
  return `gap-account:${session.id}`;
}
function read(storeKey: string): AccountData {
  return (
    (JSON.parse(sessionStorage.getItem(storeKey) || 'null') as AccountData) || {
      profile: {
        displayName: '',
        email: readSession()?.email || '',
        phone: '',
        language: 'English',
        timezone: 'Africa/Nairobi',
        biography: '',
      },
      preferences: {
        email: true,
        sms: false,
        inApp: true,
        reminders: true,
        achievementsPublic: false,
        analytics: false,
      },
      notifications: [],
      requests: [],
    }
  );
}
async function mutate(operation: (data: AccountData) => void) {
  const storeKey = await key();
  const data = read(storeKey);
  operation(data);
  sessionStorage.setItem(storeKey, JSON.stringify(data));
  return data;
}
export const accountService: AccountService = {
  async read() {
    return read(await key());
  },
  async saveProfile(profile) {
    return mutate((data) => {
      if (!profile.displayName.trim() || !profile.language || !profile.timezone)
        throw new Error('Provide your name, language and timezone.');
      data.profile = { ...profile, email: data.profile.email };
    });
  },
  async savePreferences(preferences) {
    return mutate((data) => {
      data.preferences = { ...preferences };
    });
  },
  async markRead(id) {
    return mutate((data) => {
      if (id && !data.notifications.some((item) => item.id === id))
        throw new Error('Notification not found.');
      data.notifications = data.notifications.map((item) =>
        !id || item.id === id ? { ...item, read: true } : item,
      );
    });
  },
  async request(kind, subject, detail) {
    return mutate((data) => {
      if (!subject.trim() || detail.trim().length < 10)
        throw new Error('Add a subject and at least 10 characters of detail.');
      data.requests.unshift({
        id: `DEMO-${crypto.randomUUID()}`,
        kind,
        subject,
        detail,
        status: 'Open',
        createdAt: new Date().toISOString(),
      });
    });
  },
};
