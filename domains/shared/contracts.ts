export type Role =
  | 'member'
  | 'minor'
  | 'guardian'
  | 'mentor'
  | 'content_manager'
  | 'finance_officer'
  | 'safeguarding_officer'
  | 'support'
  | 'administrator'
  | 'super_administrator';
export type AccountStatus =
  | 'unverified'
  | 'onboarding'
  | 'guardian_pending'
  | 'activation_pending'
  | 'active'
  | 'suspended'
  | 'mentor_pending';
export interface Session {
  phone?: string;
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  expiresAt: number;
}
export type InvitationState = 'valid' | 'expired' | 'used' | 'invalid';
export type MentorStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_information_required'
  | 'approved'
  | 'rejected'
  | 'suspended';
export interface Consent {
  policy: string;
  version: string;
  granted: boolean;
  recordedAt: string;
}
export interface GoalDraft {
  title: string;
  measure: string;
  targetDate: string;
  action: string;
}
export interface AuthService {
  register(email: string, password: string): Promise<Session>;
  login(email: string, password: string): Promise<Session>;
  recover(email: string): Promise<void>;
  reset(token: string, password: string): Promise<void>;
  verify(code: string): Promise<Session>;
  resend(): Promise<void>;
  logout(): Promise<void>;
}
export interface SupportService {
  submit(values: Record<string, unknown>): Promise<{ reference: string }>;
}
export interface VerificationService {
  verify(code: string): Promise<void>;
}
export interface GuardianService {
  invitation(token: string): Promise<InvitationState>;
  respond(token: string, decisions: Record<string, boolean>): Promise<void>;
  withdraw(consentId: string): Promise<void>;
}
export interface MentorService {
  submit(values: Record<string, unknown>): Promise<{ id: string; status: MentorStatus }>;
  status(id: string): Promise<{ id: string; status: MentorStatus; note: string } | null>;
  provideInformation(id: string, response: string): Promise<void>;
}
export function canEnter(session: Session | null) {
  return !!session && session.expiresAt > Date.now() && session.status === 'active';
}
export function ageAt(date: string, today = new Date()) {
  const birth = new Date(`${date}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())
  )
    age--;
  return age;
}
