'use client';
import { readSession } from '../shared/demo-services';
import { demoMaterials } from '../learning/fixtures';
import { hasPermission } from '../portal/permissions';
import type { MentorshipPortalService, MentorWorkspace } from './portal-contracts';
async function key() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. Reconnect to continue.');
  const session = readSession();
  if (!session || (!hasPermission(session, 'member.self') && !hasPermission(session, 'mentor.assigned')))
    throw new Error('This mentorship workspace is not available to your account.');
  return `gap-mentorship:${session.id}:${session.role}`;
}
function initial(): MentorWorkspace {
  const mentor = readSession()?.role === 'mentor';
  return {
    resources: demoMaterials.filter((item) => item.priceMinor === 0),
    mentor: {
      id: 'demo-mentor',
      name: 'Demonstration Mentor',
      biography: 'A fictional mentor profile for reviewing the mentorship experience.',
      expertise: ['Goal planning', 'Technology'],
      languages: ['English', 'Kiswahili'],
    },
    assignment: 'Unassigned',
    preferences: { category: '', language: 'English', availability: '' },
    mentees: mentor
      ? [
          {
            id: 'assigned-demo-member',
            name: 'Demo Member',
            minor: false,
            category: 'Technology',
            goalTitle: 'Publish a portfolio',
            progress: 25,
            health: 'Needs Attention',
            evaluation: 'I completed the outline and need help choosing the next step.',
            approvedProfile: 'Interested in practical projects and weekly accountability.',
            activity: ['Goal plan created', 'First milestone started'],
            evidence: ['Portfolio outline shared for review'],
            actions: [
              { title: 'Draft one portfolio page', frequency: 'Weekly', duration: 30, status: 'Upcoming' },
            ],
          },
          {
            id: 'assigned-demo-minor',
            name: 'Demo Younger Member',
            minor: true,
            category: 'Education',
            goalTitle: 'Build a study routine',
            progress: 50,
            health: 'On Track',
            evaluation: 'My weekly study routine is becoming more consistent.',
            approvedProfile: 'Guardian-approved educational mentorship only.',
            activity: ['Guardian consent confirmed in fixture', 'Weekly practice recorded'],
            evidence: [],
            actions: [
              {
                title: 'Review study notes',
                frequency: 'Selected weekdays',
                duration: 20,
                status: 'Upcoming',
              },
            ],
          },
        ]
      : [],
    sessions: [],
    messages: [],
    notes: [],
    recommendations: [],
    interventions: [],
    reviewedEvaluations: [],
    concerns: [],
    availability: { weekdays: [], from: '09:00', to: '17:00', capacity: 5, timezone: 'Africa/Nairobi' },
    complianceAccepted: false,
  };
}
function read(store: string): MentorWorkspace {
  const data = (JSON.parse(sessionStorage.getItem(store) || 'null') as MentorWorkspace) || initial();
  data.resources = demoMaterials.filter((item) => item.priceMinor === 0);
  return data;
}
function assertMentor() {
  if (!hasPermission(readSession(), 'mentor.assigned'))
    throw new Error('This operation requires an approved mentor.');
}
function assertMember() {
  if (!hasPermission(readSession(), 'member.self'))
    throw new Error('This operation is for the member account.');
}
function scope(data: MentorWorkspace, memberId: string) {
  const session = readSession();
  if (session && hasPermission(session, 'member.self') && session.id === memberId) return;
  if (
    session &&
    hasPermission(session, 'mentor.assigned') &&
    data.mentees.some((item) => item.id === memberId)
  )
    return;
  throw new Error('This member is not assigned to you.');
}
async function mutate(fn: (data: MentorWorkspace) => void) {
  const store = await key();
  const data = read(store);
  fn(data);
  sessionStorage.setItem(store, JSON.stringify(data));
  return data;
}
const required = (value: string) => {
  if (value.trim().length < 3) throw new Error('Provide at least three characters of detail.');
};
export const mentorshipPortal: MentorshipPortalService = {
  async read() {
    const data = read(await key());
    if (readSession()?.role !== 'mentor') {
      data.notes = [];
      data.mentees = [];
    }
    return data;
  },
  async mentee(id) {
    const data = read(await key());
    assertMentor();
    scope(data, id);
    return data.mentees.find((item) => item.id === id)!;
  },
  async requestMentor(preferences) {
    return mutate((data) => {
      assertMember();
      required(preferences.category);
      required(preferences.availability);
      data.preferences = preferences;
      if (data.assignment === 'Unassigned' || data.assignment === 'Requested') data.assignment = 'Proposed';
    });
  },
  async assignment(action, detail = '') {
    return mutate((data) => {
      assertMember();
      if (action === 'accept' && data.assignment !== 'Proposed')
        throw new Error('There is no proposed assignment to accept.');
      if (action === 'concern') required(detail);
      data.assignment = action === 'accept' ? 'Accepted' : 'Concern raised';
      if (detail)
        data.concerns.push({
          id: crypto.randomUUID(),
          memberId: readSession()!.id,
          kind: 'Assignment concern',
          detail,
        });
    });
  },
  async schedule(input) {
    return mutate((data) => {
      scope(data, input.memberId);
      required(input.title);
      if (readSession()?.role !== 'mentor' && data.assignment !== 'Accepted')
        throw new Error('Accept a mentor assignment before booking.');
      if (
        !input.startsAt ||
        new Date(input.startsAt).getTime() <= Date.now() ||
        input.duration < 15 ||
        input.duration > 120
      )
        throw new Error('Choose a future session lasting 15–120 minutes.');
      if (
        data.sessions.some(
          (item) =>
            item.status === 'Scheduled' &&
            Math.abs(new Date(item.startsAt).getTime() - new Date(input.startsAt).getTime()) <
              Math.max(item.duration, input.duration) * 60000,
        )
      )
        throw new Error('This time overlaps another session. Choose a different time.');
      data.sessions.push({
        ...input,
        id: crypto.randomUUID(),
        status: 'Scheduled',
        outcome: '',
        joinUrl: null,
        oversight:
          readSession()?.role === 'minor' || !!data.mentees.find((item) => item.id === input.memberId)?.minor,
      });
    });
  },
  async session(id, action, detail, startsAt) {
    return mutate((data) => {
      const item = data.sessions.find((item) => item.id === id);
      if (!item) throw new Error('Session not found.');
      scope(data, item.memberId);
      required(detail);
      if (item.status !== 'Scheduled') throw new Error('Only scheduled sessions can be changed.');
      if (action === 'complete') assertMentor();
      if (action === 'reschedule') {
        if (!startsAt || new Date(startsAt).getTime() <= Date.now())
          throw new Error('Choose a future session time.');
        if (
          data.sessions.some(
            (other) =>
              other.id !== id &&
              other.status === 'Scheduled' &&
              Date.parse(startsAt!) < Date.parse(other.startsAt) + other.duration * 60000 &&
              Date.parse(startsAt!) + item.duration * 60000 > Date.parse(other.startsAt),
          )
        )
          throw new Error('This time overlaps another session. Choose a different time.');
        item.startsAt = startsAt;
      } else item.status = action === 'cancel' ? 'Cancelled' : 'Completed';
      item.outcome = detail;
    });
  },
  async send(memberId, body) {
    return mutate((data) => {
      scope(data, memberId);
      required(body);
      if (readSession()?.role !== 'mentor' && data.assignment !== 'Accepted')
        throw new Error('Accept an assignment before messaging.');
      data.messages.push({
        id: crypto.randomUUID(),
        memberId,
        author: readSession()?.role === 'mentor' ? 'Mentor' : 'Member',
        body,
        at: new Date().toISOString(),
        reported: false,
      });
    });
  },
  async reportMessage(id, detail) {
    return mutate((data) => {
      required(detail);
      const item = data.messages.find((item) => item.id === id);
      if (!item) throw new Error('Message not found.');
      scope(data, item.memberId);
      item.reported = true;
      data.concerns.push({
        id: crypto.randomUUID(),
        memberId: item.memberId,
        kind: 'Message report',
        detail,
      });
    });
  },
  async note(memberId, body) {
    return mutate((data) => {
      assertMentor();
      scope(data, memberId);
      required(body);
      data.notes.push({ id: crypto.randomUUID(), memberId, body, at: new Date().toISOString() });
    });
  },
  async recommend(memberId, title, body) {
    return mutate((data) => {
      assertMentor();
      scope(data, memberId);
      required(title);
      required(body);
      data.recommendations.push({
        id: crypto.randomUUID(),
        memberId,
        title,
        body,
        status: 'Proposed',
        response: '',
      });
    });
  },
  async respondRecommendation(id, action, response) {
    return mutate((data) => {
      assertMember();
      const item = data.recommendations.find((item) => item.id === id);
      if (!item) throw new Error('Recommendation not found.');
      scope(data, item.memberId);
      if (action === 'Clarification requested') required(response);
      item.status = action;
      item.response = response;
    });
  },
  async intervene(memberId, trigger, recommendation, followUp) {
    return mutate((data) => {
      assertMentor();
      scope(data, memberId);
      required(trigger);
      required(recommendation);
      if (!followUp || followUp < new Date().toISOString().slice(0, 10))
        throw new Error('Choose a valid follow-up date.');
      data.interventions.push({
        id: crypto.randomUUID(),
        memberId,
        trigger,
        recommendation,
        followUp,
        status: 'Open',
        outcome: '',
      });
    });
  },
  async completeIntervention(id, outcome) {
    return mutate((data) => {
      assertMentor();
      required(outcome);
      const item = data.interventions.find((item) => item.id === id);
      if (!item) throw new Error('Intervention not found.');
      scope(data, item.memberId);
      item.status = 'Complete';
      item.outcome = outcome;
    });
  },
  async reviewEvaluation(memberId, note) {
    return mutate((data) => {
      assertMentor();
      scope(data, memberId);
      required(note);
      if (!data.reviewedEvaluations.includes(memberId)) data.reviewedEvaluations.push(memberId);
      data.notes.push({
        id: crypto.randomUUID(),
        memberId,
        body: `Evaluation review: ${note}`,
        at: new Date().toISOString(),
      });
    });
  },
  async concern(memberId, kind, detail) {
    return mutate((data) => {
      scope(data, memberId);
      required(detail);
      data.concerns.push({ id: crypto.randomUUID(), memberId, kind, detail });
    });
  },
  async saveAvailability(input) {
    return mutate((data) => {
      assertMentor();
      if (!input.weekdays.length || input.to <= input.from || input.capacity < 1 || input.capacity > 30)
        throw new Error('Choose days, a valid time window and capacity from 1 to 30.');
      data.availability = input;
    });
  },
  async saveProfile(input) {
    return mutate((data) => {
      assertMentor();
      required(input.name);
      required(input.biography);
      data.mentor = { ...input, id: data.mentor.id };
    });
  },
  async acceptCompliance() {
    return mutate((data) => {
      assertMentor();
      data.complianceAccepted = true;
    });
  },
};
