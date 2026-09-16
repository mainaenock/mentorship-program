'use client';
import { readSession } from '../shared/demo-services';
import { assertPermission, hasPermission } from '../portal/permissions';
import { adminSchemas } from './schemas';
import type { AdminData, AdminRecord, AdminSchema, AdminService } from './contracts';
async function key() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. The operation was not saved.');
  const session = readSession();
  assertPermission(session, 'staff.workspace');
  return `gap-admin:${session.id}`;
}
function schema(id: string) {
  const value = adminSchemas[id];
  if (!value) throw new Error('Unknown administrative collection.');
  assertPermission(readSession(), value.permission);
  return value;
}
function read(store: string): AdminData {
  const saved = sessionStorage.getItem(store);
  if (saved) return JSON.parse(saved) as AdminData;
  return {
    records: Object.values(adminSchemas).flatMap((shape) =>
      [1, 2, 3].map((index) => {
        const values = Object.fromEntries(
          shape.fields.map((field) => [
            field.key,
            field.kind === 'number'
              ? field.key === 'progress'
                ? index * 25
                : 100
              : field.kind === 'boolean'
                ? false
                : field.kind === 'date'
                  ? '2027-01-15'
                  : field.kind === 'select'
                    ? field.options?.[index % field.options.length] || ''
                    : field.key === 'title'
                      ? `Demo ${shape.title} ${index}`
                      : field.key === 'email'
                        ? `demo-${index}@example.test`
                        : field.key === 'currency'
                          ? 'KES'
                          : field.key === 'description'
                            ? 'Fictional record for reviewing this administrative workflow.'
                            : `demo-${field.key}-${index}`,
          ]),
        );
        return {
          id: `demo-${shape.id}-${index}`,
          schemaId: shape.id,
          title: String(values.title),
          values,
          status: shape.id === 'payments' && index === 1 ? 'Successful' : shape.initialStatus,
          createdAt: '2026-09-15T08:00:00Z',
          updatedAt: '2026-09-15T08:00:00Z',
          version: 1,
        };
      }),
    ),
    audit: [],
    views: {},
  };
}
function write(store: string, data: AdminData) {
  sessionStorage.setItem(store, JSON.stringify(data));
}
function record(data: AdminData, schemaId: string, id: string) {
  const item = data.records.find((item) => item.id === id && item.schemaId === schemaId);
  if (!item) throw new Error('Record not found in this collection.');
  return item;
}
function validate(shape: AdminSchema, values: AdminRecord['values']) {
  for (const field of shape.fields) {
    const value = values[field.key];
    if (field.required && (value === undefined || String(value).trim() === ''))
      throw new Error(`${field.label} is required.`);
    if (field.kind === 'number' && (!Number.isFinite(Number(value)) || !Number.isInteger(Number(value))))
      throw new Error(`${field.label} must be a whole number.`);
    if (field.kind === 'select' && !field.options?.includes(String(value)))
      throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
    if (field.key === 'sourceUrl' && value && !String(value).startsWith('https://'))
      throw new Error('Media sources must use HTTPS.');
  }
}
function audit(data: AdminData, item: AdminRecord, action: string, reason: string, before: string) {
  item.updatedAt = new Date().toISOString();
  item.version++;
  data.audit.unshift({
    id: crypto.randomUUID(),
    schemaId: item.schemaId,
    recordId: item.id,
    actor: readSession()!.email,
    action,
    reason,
    at: item.updatedAt,
    before,
    after: JSON.stringify(item),
  });
}
export const adminService: AdminService = {
  async list(id) {
    schema(id);
    return read(await key()).records.filter((item) => item.schemaId === id);
  },
  async get(id, recordId) {
    schema(id);
    return record(read(await key()), id, recordId);
  },
  async save(id, recordId, version, values) {
    const shape = schema(id);
    assertPermission(readSession(), shape.editPermission);
    validate(shape, values);
    const store = await key();
    const data = read(store);
    if (!recordId && !shape.canCreate)
      throw new Error('Records in this collection are created by their source workflow.');
    if (recordId && shape.immutable)
      throw new Error('Original records in this collection cannot be edited. Use an audited transition.');
    const item = recordId
      ? record(data, id, recordId)
      : {
          id: crypto.randomUUID(),
          schemaId: id,
          title: '',
          status: shape.initialStatus,
          values: {},
          createdAt: new Date().toISOString(),
          updatedAt: '',
          version: 0,
        };
    if (recordId && item.version !== version)
      throw new Error('This record changed. Reload it before saving.');
    if (item.status === 'Archived') throw new Error('Archived records are read-only.');
    const before = JSON.stringify(item);
    item.values = Object.fromEntries(shape.fields.map((field) => [field.key, values[field.key] ?? '']));
    item.title = String(values.title);
    if (!recordId) data.records.unshift(item);
    audit(data, item, recordId ? 'Edit' : 'Create', 'Validated administrative edit', before);
    write(store, data);
    return item;
  },
  async transition(id, ids, command, reason, values = {}) {
    const shape = schema(id);
    const transition = shape.transitions.find((item) => item.command === command);
    if (!transition) throw new Error('This operation is not available for this collection.');
    assertPermission(readSession(), transition.permission);
    if (!ids.length || reason.trim().length < 5)
      throw new Error('Select records and provide a reason of at least five characters.');
    for (const field of transition.fields || [])
      if (field.required && !String(values[field.key] || '').trim())
        throw new Error(`${field.label} is required.`);
    const store = await key();
    const data = read(store);
    const selected = [...new Set(ids)].map((recordId) => record(data, id, recordId));
    if (selected.some((item) => !transition.from.includes(item.status)))
      throw new Error('One or more selected records cannot make this transition. No records were changed.');
    for (const item of selected) {
      const before = JSON.stringify(item);
      item.status = transition.to;
      for (const field of transition.fields || []) item.values[field.key] = values[field.key];
      audit(data, item, command, reason, before);
      if (command === 'Reverse Adjustment') {
        const reversal: AdminRecord = {
          ...item,
          id: crypto.randomUUID(),
          title: `Reversal of ${item.title}`,
          status: 'Recorded',
          values: {
            ...item.values,
            title: `Reversal of ${item.title}`,
            delta: -Number(item.values.delta),
            description: reason,
          },
          createdAt: new Date().toISOString(),
          version: 0,
        };
        data.records.push(reversal);
        audit(data, reversal, 'Compensating adjustment', `Reverses ${item.id}: ${reason}`, 'null');
      }
    }
    write(store, data);
    return selected;
  },
  async note(id, recordId, body) {
    const shape = schema(id);
    assertPermission(readSession(), shape.editPermission);
    if (body.trim().length < 3) throw new Error('Write an internal note.');
    const store = await key();
    const data = read(store);
    const item = record(data, id, recordId);
    audit(data, item, 'Internal note', body, JSON.stringify(item));
    write(store, data);
  },
  async audit(id, recordId) {
    if (id) schema(id);
    else assertPermission(readSession(), 'audit.read');
    return read(await key()).audit.filter(
      (item) =>
        (!id || item.schemaId === id) &&
        (!recordId || item.recordId === recordId) &&
        hasPermission(readSession(), adminSchemas[item.schemaId].permission),
    );
  },
  async export(id, ids) {
    assertPermission(readSession(), 'export');
    const shape = schema(id);
    const rows = (await this.list(id)).filter((item) => !ids.length || ids.includes(item.id));
    const quote = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    return [
      ['Reference', 'Status', ...shape.fields.map((field) => field.label)].map(quote).join(','),
      ...rows.map((item) =>
        [item.id, item.status, ...shape.fields.map((field) => item.values[field.key])].map(quote).join(','),
      ),
    ].join('\r\n');
  },
  async views(route) {
    return read(await key()).views[route] || [];
  },
  async saveView(route, view) {
    const store = await key();
    const data = read(store);
    if (!view.name.trim()) throw new Error('Give the saved view a name.');
    data.views[route] = [...(data.views[route] || []).filter((item) => item.name !== view.name), view];
    write(store, data);
  },
};
