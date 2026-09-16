import type { Permission } from '../portal/permissions';
export type AdminCommand =
  | 'Approve'
  | 'Reject'
  | 'Request More Information'
  | 'Suspend'
  | 'Reactivate'
  | 'Assign Mentor'
  | 'Reassign Mentor'
  | 'Publish'
  | 'Unpublish'
  | 'Archive'
  | 'Refund'
  | 'Reverse Adjustment'
  | 'Reconcile'
  | 'Send Notification'
  | 'Escalate'
  | 'Resolve';
export interface AdminField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';
  required?: boolean;
  options?: string[];
}
export interface AdminTransition {
  command: AdminCommand;
  from: string[];
  to: string;
  permission: Permission;
  consequence: string;
  fields?: AdminField[];
}
export interface AdminSchema {
  id: string;
  title: string;
  permission: Permission;
  editPermission: Permission;
  fields: AdminField[];
  initialStatus: string;
  transitions: AdminTransition[];
  canCreate: boolean;
  immutable?: boolean;
}
export interface AdminRecord {
  id: string;
  schemaId: string;
  title: string;
  status: string;
  values: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  version: number;
}
export interface AdminAudit {
  id: string;
  recordId: string;
  schemaId: string;
  actor: string;
  action: string;
  reason: string;
  at: string;
  before: string;
  after: string;
}
export interface AdminView {
  name: string;
  query: string;
  status: string;
  sort: string;
}
export interface AdminData {
  records: AdminRecord[];
  audit: AdminAudit[];
  views: Record<string, AdminView[]>;
}
export interface AdminService {
  list(schemaId: string): Promise<AdminRecord[]>;
  get(schemaId: string, id: string): Promise<AdminRecord>;
  save(
    schemaId: string,
    id: string | null,
    version: number,
    values: AdminRecord['values'],
  ): Promise<AdminRecord>;
  transition(
    schemaId: string,
    ids: string[],
    command: AdminCommand,
    reason: string,
    values?: AdminRecord['values'],
  ): Promise<AdminRecord[]>;
  note(schemaId: string, id: string, body: string): Promise<void>;
  audit(schemaId?: string, id?: string): Promise<AdminAudit[]>;
  export(schemaId: string, ids: string[]): Promise<string>;
  views(route: string): Promise<AdminView[]>;
  saveView(route: string, view: AdminView): Promise<void>;
}
