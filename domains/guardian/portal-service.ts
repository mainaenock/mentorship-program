'use client';
import { readSession } from '../shared/demo-services';
import { assertPermission } from '../portal/permissions';
export interface ChildRelationship {
  id: string;
  childName: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Unlink requested';
  consents: { participation: boolean; mentorship: boolean; learning: boolean };
  goalSummary: string;
  mentorName: string;
  mentorSummary?: string;
  sessions?: {
    id: string;
    title: string;
    startsAt: string;
    duration: number;
    status: string;
    oversight: string;
  }[];
}
export interface GuardianWorkspace {
  children: ChildRelationship[];
  audit: { id: string; at: string; relationshipId: string; action: string; detail: string }[];
  concerns: { id: string; relationshipId: string; kind: string; detail: string; status: 'Open' }[];
}
export interface GuardianPortalService {
  read(): Promise<GuardianWorkspace>;
  child(id: string): Promise<ChildRelationship>;
  relationship(
    id: string,
    action: 'accept' | 'decline' | 'unlink',
    reason: string,
  ): Promise<GuardianWorkspace>;
  consent(
    id: string,
    scope: keyof ChildRelationship['consents'],
    granted: boolean,
    reason: string,
  ): Promise<GuardianWorkspace>;
  concern(id: string, kind: string, detail: string): Promise<GuardianWorkspace>;
}
async function key() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. Consent has not changed.');
  const session = readSession();
  assertPermission(session, 'guardian.linked');
  return `gap-guardian:${session.id}`;
}
function read(store: string): GuardianWorkspace {
  return (
    (JSON.parse(sessionStorage.getItem(store) || 'null') as GuardianWorkspace) || {
      children: [
        {
          id: 'demo-relationship',
          childName: 'Demo Child',
          status: 'Pending',
          consents: { participation: false, mentorship: false, learning: false },
          goalSummary: 'Working on a consistent study routine.',
          mentorName: 'Demonstration Mentor',
          mentorSummary:
            'Study planning and weekly accountability. Languages: English and Kiswahili. Guardian-approved educational scope.',
          sessions: [
            {
              id: 'demo-guardian-session',
              title: 'Study routine review',
              startsAt: '2027-01-15T14:00:00+03:00',
              duration: 30,
              status: 'Scheduled',
              oversight:
                'Guardian oversight required. Joining details will be shared through the approved scheduling service.',
            },
          ],
        },
      ],
      audit: [],
      concerns: [],
    }
  );
}
function child(data: GuardianWorkspace, id: string) {
  const item = data.children.find((item) => item.id === id);
  if (!item) throw new Error('This child relationship is not linked to your account.');
  return item;
}
function audit(data: GuardianWorkspace, relationshipId: string, action: string, detail: string) {
  data.audit.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    relationshipId,
    action,
    detail,
  });
}
async function mutate(id: string, operation: (data: GuardianWorkspace, item: ChildRelationship) => void) {
  const store = await key();
  const data = read(store);
  operation(data, child(data, id));
  sessionStorage.setItem(store, JSON.stringify(data));
  return project(data);
}
function project(data: GuardianWorkspace): GuardianWorkspace {
  return {
    ...data,
    children: data.children.map((item) => ({
      ...item,
      goalSummary: item.status === 'Accepted' && item.consents.participation ? item.goalSummary : '',
      mentorName: item.status === 'Accepted' && item.consents.mentorship ? item.mentorName : '',
      mentorSummary: item.status === 'Accepted' && item.consents.mentorship ? item.mentorSummary : '',
      sessions: item.status === 'Accepted' && item.consents.mentorship ? item.sessions || [] : [],
    })),
  };
}
export const guardianPortal: GuardianPortalService = {
  async read() {
    return project(read(await key()));
  },
  async child(id) {
    return child(project(read(await key())), id);
  },
  async relationship(id, action, reason) {
    return mutate(id, (data, item) => {
      if (reason.trim().length < 3) throw new Error('Provide a reason for this relationship decision.');
      if (action !== 'unlink' && item.status !== 'Pending')
        throw new Error('This relationship request has already been decided.');
      if (action === 'unlink' && item.status !== 'Accepted')
        throw new Error('Only an accepted relationship can request unlinking.');
      item.status = action === 'accept' ? 'Accepted' : action === 'decline' ? 'Declined' : 'Unlink requested';
      if (action !== 'accept') item.consents = { participation: false, mentorship: false, learning: false };
      audit(data, id, `Relationship ${item.status}`, reason);
    });
  },
  async consent(id, scope, granted, reason) {
    return mutate(id, (data, item) => {
      if (item.status !== 'Accepted')
        throw new Error('Accept the verified relationship before changing consent.');
      if (reason.trim().length < 3) throw new Error('Record the reason for this consent decision.');
      if (granted && scope !== 'participation' && !item.consents.participation)
        throw new Error('Participation consent is required first.');
      item.consents[scope] = granted;
      if (scope === 'participation' && !granted) {
        item.consents.mentorship = false;
        item.consents.learning = false;
      }
      audit(data, id, `${scope} consent ${granted ? 'granted' : 'withdrawn'} · v1`, reason);
    });
  },
  async concern(id, kind, detail) {
    return mutate(id, (data) => {
      if (detail.trim().length < 10) throw new Error('Describe your concern in at least 10 characters.');
      data.concerns.push({ id: crypto.randomUUID(), relationshipId: id, kind, detail, status: 'Open' });
      audit(data, id, kind, 'A confidential review request was recorded.');
    });
  },
};
