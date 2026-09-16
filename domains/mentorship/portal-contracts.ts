import type { Material } from '../learning/contracts';
export interface MentorProfile {
  id: string;
  name: string;
  biography: string;
  expertise: string[];
  languages: string[];
}
export interface MenteeSummary {
  id: string;
  name: string;
  minor: boolean;
  category: string;
  goalTitle: string;
  progress: number;
  health: 'On Track' | 'Needs Attention' | 'At Risk';
  evaluation: string;
  approvedProfile: string;
  activity: string[];
  evidence: string[];
  actions?: { title: string; frequency: string; duration: number; status: string }[];
}
export interface MentorSession {
  id: string;
  memberId: string;
  title: string;
  startsAt: string;
  duration: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  agenda: string;
  outcome: string;
  joinUrl: string | null;
  oversight: boolean;
}
export interface PortalMessage {
  id: string;
  memberId: string;
  author: string;
  body: string;
  at: string;
  reported: boolean;
}
export interface MentorNote {
  id: string;
  memberId: string;
  body: string;
  at: string;
}
export interface Recommendation {
  id: string;
  memberId: string;
  title: string;
  body: string;
  status: 'Proposed' | 'Accepted' | 'Clarification requested';
  response: string;
}
export interface MentorIntervention {
  id: string;
  memberId: string;
  trigger: string;
  recommendation: string;
  followUp: string;
  status: 'Open' | 'Complete';
  outcome: string;
}
export interface MentorWorkspace {
  resources: Material[];
  mentor: MentorProfile;
  assignment: 'Unassigned' | 'Requested' | 'Proposed' | 'Accepted' | 'Concern raised';
  preferences: { category: string; language: string; availability: string };
  mentees: MenteeSummary[];
  sessions: MentorSession[];
  messages: PortalMessage[];
  notes: MentorNote[];
  recommendations: Recommendation[];
  interventions: MentorIntervention[];
  reviewedEvaluations: string[];
  concerns: { id: string; memberId: string; kind: string; detail: string }[];
  availability: { weekdays: string[]; from: string; to: string; capacity: number; timezone: string };
  complianceAccepted: boolean;
}
export interface MentorshipPortalService {
  read(): Promise<MentorWorkspace>;
  mentee(id: string): Promise<MenteeSummary>;
  requestMentor(preferences: MentorWorkspace['preferences']): Promise<MentorWorkspace>;
  assignment(action: 'accept' | 'concern', detail?: string): Promise<MentorWorkspace>;
  schedule(
    input: Pick<MentorSession, 'memberId' | 'title' | 'startsAt' | 'duration' | 'agenda'>,
  ): Promise<MentorWorkspace>;
  session(
    id: string,
    action: 'reschedule' | 'cancel' | 'complete',
    detail: string,
    startsAt?: string,
  ): Promise<MentorWorkspace>;
  send(memberId: string, body: string): Promise<MentorWorkspace>;
  reportMessage(id: string, detail: string): Promise<MentorWorkspace>;
  note(memberId: string, body: string): Promise<MentorWorkspace>;
  recommend(memberId: string, title: string, body: string): Promise<MentorWorkspace>;
  respondRecommendation(
    id: string,
    action: 'Accepted' | 'Clarification requested',
    response: string,
  ): Promise<MentorWorkspace>;
  intervene(
    memberId: string,
    trigger: string,
    recommendation: string,
    followUp: string,
  ): Promise<MentorWorkspace>;
  completeIntervention(id: string, outcome: string): Promise<MentorWorkspace>;
  reviewEvaluation(memberId: string, note: string): Promise<MentorWorkspace>;
  concern(memberId: string, kind: string, detail: string): Promise<MentorWorkspace>;
  saveAvailability(input: MentorWorkspace['availability']): Promise<MentorWorkspace>;
  saveProfile(input: MentorProfile): Promise<MentorWorkspace>;
  acceptCompliance(): Promise<MentorWorkspace>;
}
