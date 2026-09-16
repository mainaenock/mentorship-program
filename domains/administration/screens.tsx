'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Check, Field, Modal, Notice, Select, Skeleton, Textarea } from '../shared/ui';
import { Pagination } from '../shared/composites';
import { Mutation } from '../goals/screens';
import { downloadText } from '../learning/screens';
import { readSession } from '../shared/demo-services';
import { hasPermission } from '../portal/permissions';
import { adminSchemas, schemaForRoute } from './schemas';
import { adminService } from './demo-service';
import { AnalyticsReport } from './analytics';
import type { AdminAudit, AdminField, AdminRecord, AdminSchema, AdminView } from './contracts';

export function AdminPage({ path }: { path: string }) {
  if (path === '/admin' || path === '/admin/reports') return <AdminOverview />;
  if (path === '/admin/compliance/audit') return <AuditHistory />;
  return <AdminCollection key={path} path={path} />;
}
function AdminCollection({ path }: { path: string }) {
  const shape = adminSchemas[schemaForRoute(path)];
  const [rows, setRows] = useState<AdminRecord[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [views, setViews] = useState<AdminView[]>([]);
  async function load() {
    setError('');
    try {
      const [records, saved] = await Promise.all([adminService.list(shape.id), adminService.views(path)]);
      setRows(records);
      setViews(saved);
      setSelected([]);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!rows)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  const canEdit = hasPermission(readSession(), shape.editPermission);
  const leaf = path.split('/').at(-1) || '';
  const scoped = rows.filter((row) => {
    if (shape.id === 'users' && ['members', 'guardians', 'mentors'].includes(leaf))
      return (
        String(row.values.role) === leaf.slice(0, -1) || (leaf === 'members' && row.values.role === 'minor')
      );
    if (leaf === 'at-risk') return row.values.risk === 'At Risk';
    if (shape.id === 'settings' && leaf !== 'settings') return row.values.group === leaf;
    if (shape.id === 'engagement' && leaf !== 'notifications')
      return (
        row.values.channel ===
        ({ email: 'Email', sms: 'SMS', announcements: 'Announcement' } as Record<string, string>)[leaf]
      );
    if (leaf === 'reconciliation') return row.status !== 'Reconciled';
    return true;
  });
  const filtered = scoped
    .filter(
      (row) =>
        (status === 'All' || row.status === status) &&
        `${row.title} ${row.id} ${Object.values(row.values).join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'Title A–Z'
        ? a.title.localeCompare(b.title)
        : sort === 'Status'
          ? a.status.localeCompare(b.status)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const detailId =
    (/^\/admin\/users\/[^/]+$/.test(path) && !['members', 'guardians', 'mentors', 'staff'].includes(leaf)) ||
    (/^\/admin\/learning\/materials\/[^/]+$/.test(path) && leaf !== 'new')
      ? leaf
      : null;
  const detail = detailId ? rows.find((row) => row.id === detailId) : null;
  return (
    <>
      <Notice>
        Demonstration operations · changes and audit records remain in this browser tab. No live account,
        payment or message is changed.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      {['statistics', 'analytics', 'reports', 'revenue', 'reconciliation', 'ledger'].includes(leaf) && (
        <CollectionSummary path={path} rows={scoped} />
      )}
      {leaf === 'new' && canEdit && <RecordEditor shape={shape} onSaved={load} />}
      {detailId ? (
        detail ? (
          <RecordDetail shape={shape} row={detail} onChanged={load} />
        ) : (
          <Card>
            <h2>Record not found</h2>
            <p>The reference is not available in this collection.</p>
          </Card>
        )
      ) : (
        <>
          <div className="portal-toolbar">
            <Field
              label="Search records"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Status filter"
              options={['All', ...new Set(rows.map((row) => row.status))]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
            <Select
              label="Sort records"
              options={['Newest', 'Title A–Z', 'Status']}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
          <div className="actions">
            {shape.canCreate && canEdit && <RecordEditor shape={shape} onSaved={load} />}
            <Mutation
              title="Save View"
              onSubmit={async (form) => {
                await adminService.saveView(path, { name: String(form.get('name')), query, status, sort });
                setViews(await adminService.views(path));
              }}
            >
              <Field label="View name" name="name" required />
            </Mutation>
            {hasPermission(readSession(), 'export') && (
              <Mutation
                title="Export"
                onSubmit={async () =>
                  downloadText(
                    `${shape.id}.csv`,
                    await adminService.export(
                      shape.id,
                      selected.length ? selected : filtered.map((row) => row.id),
                    ),
                  )
                }
              >
                <p>
                  Export {selected.length || filtered.length} permitted records. CSV values are escaped to
                  prevent spreadsheet formula execution.
                </p>
              </Mutation>
            )}
            <Modal title="View Audit Trail" trigger={<Button variant="outline">View Audit Trail</Button>}>
              <AuditHistory schemaId={shape.id} />
            </Modal>
          </div>
          {!!views.length && (
            <label className="field">
              Saved views
              <select
                defaultValue=""
                onChange={(e) => {
                  const view = views.find((item) => item.name === e.target.value);
                  if (view) {
                    setQuery(view.query);
                    setStatus(view.status);
                    setSort(view.sort);
                    setPage(1);
                  }
                }}
              >
                <option value="">Choose saved view</option>
                {views.map((view) => (
                  <option key={view.name}>{view.name}</option>
                ))}
              </select>
            </label>
          )}
          {!!selected.length && (
            <Card>
              <p>{selected.length} records selected</p>
              <div className="actions">
                {shape.transitions
                  .filter(
                    (transition) =>
                      hasPermission(readSession(), transition.permission) &&
                      rows
                        .filter((row) => selected.includes(row.id))
                        .every((row) => transition.from.includes(row.status)),
                  )
                  .map((transition) => (
                    <Mutation
                      key={transition.command}
                      title={`Bulk ${transition.command}`}
                      confirmation={transition.consequence}
                      onSubmit={async (form) => {
                        await adminService.transition(
                          shape.id,
                          selected,
                          transition.command,
                          String(form.get('reason')),
                          fieldsFrom(form, transition.fields || []),
                        );
                        await load();
                      }}
                    >
                      <Textarea label="Bulk operation reason" name="reason" required minLength={5} />
                      <AdminFields fields={transition.fields || []} />
                    </Mutation>
                  ))}
                <Button variant="ghost" onClick={() => setSelected([])}>
                  Clear Selection
                </Button>
              </div>
            </Card>
          )}
          {!visible.length ? (
            <Card>
              <h2>No matching records</h2>
              <p>Try another search or filter.</p>
            </Card>
          ) : (
            <div className="responsive-table">
              <table>
                <caption>
                  {shape.title} · {filtered.length} matching records
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <Check
                        checked={visible.every((row) => selected.includes(row.id))}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...new Set([...selected, ...visible.map((row) => row.id)])]
                              : selected.filter((id) => !visible.some((row) => row.id === id)),
                          )
                        }
                      >
                        Select page
                      </Check>
                    </th>
                    <th scope="col">Record</th>
                    <th scope="col">Status</th>
                    <th scope="col">Updated</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Select">
                        <Check
                          checked={selected.includes(row.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, row.id]
                                : selected.filter((id) => id !== row.id),
                            )
                          }
                        >{`Select ${row.title}`}</Check>
                      </td>
                      <td data-label="Record">
                        {row.title}
                        <small className="record-reference">{row.id}</small>
                      </td>
                      <td data-label="Status">
                        <Badge>{row.status}</Badge>
                      </td>
                      <td data-label="Updated">{new Date(row.updatedAt).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        <Modal title={row.title} trigger={<Button variant="outline">View</Button>}>
                          <RecordDetail shape={shape} row={row} onChanged={load} />
                        </Modal>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
function fieldsFrom(form: FormData, fields: AdminField[]) {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.kind === 'boolean'
        ? form.get(field.key) === 'on'
        : field.kind === 'number'
          ? Number(form.get(field.key))
          : String(form.get(field.key) || ''),
    ]),
  );
}
function AdminFields({ fields, values = {} }: { fields: AdminField[]; values?: AdminRecord['values'] }) {
  return (
    <>
      {fields.map((field) =>
        field.kind === 'textarea' ? (
          <Textarea
            key={field.key}
            label={field.label}
            name={field.key}
            required={field.required}
            defaultValue={String(values[field.key] || '')}
          />
        ) : field.kind === 'select' ? (
          <Select
            key={field.key}
            label={field.label}
            name={field.key}
            options={field.options || []}
            required={field.required}
            defaultValue={String(values[field.key] || '')}
          />
        ) : field.kind === 'boolean' ? (
          <Check key={field.key} name={field.key} defaultChecked={Boolean(values[field.key])}>
            {field.label}
          </Check>
        ) : (
          <Field
            key={field.key}
            label={field.label}
            name={field.key}
            type={field.kind}
            required={field.required}
            defaultValue={String(values[field.key] ?? '')}
          />
        ),
      )}
    </>
  );
}
function RecordEditor({
  shape,
  row,
  onSaved,
}: {
  shape: AdminSchema;
  row?: AdminRecord;
  onSaved: () => Promise<void>;
}) {
  return (
    <Mutation
      title={row ? 'Edit' : 'Create'}
      onSubmit={async (form) => {
        await adminService.save(shape.id, row?.id || null, row?.version || 0, fieldsFrom(form, shape.fields));
        await onSaved();
      }}
    >
      <AdminFields fields={shape.fields} values={row?.values} />
    </Mutation>
  );
}
function RecordDetail({
  shape,
  row,
  onChanged,
}: {
  shape: AdminSchema;
  row: AdminRecord;
  onChanged: () => Promise<void>;
}) {
  return (
    <>
      <Badge>{row.status}</Badge>
      <dl>
        {shape.fields.map((field) => (
          <div key={field.key}>
            <dt>{field.label}</dt>
            <dd>{String(row.values[field.key] ?? 'Not provided')}</dd>
          </div>
        ))}
      </dl>
      <div className="actions">
        {hasPermission(readSession(), shape.editPermission) && row.status !== 'Archived' && (
          <>
            {!shape.immutable && <RecordEditor shape={shape} row={row} onSaved={onChanged} />}
            <Mutation
              title="Add Internal Note"
              onSubmit={async (form) => {
                await adminService.note(shape.id, row.id, String(form.get('body')));
                await onChanged();
              }}
            >
              <Textarea label="Internal note" name="body" required minLength={3} />
            </Mutation>
          </>
        )}
        {shape.transitions
          .filter(
            (transition) =>
              transition.from.includes(row.status) && hasPermission(readSession(), transition.permission),
          )
          .map((transition) => (
            <Mutation
              key={transition.command}
              title={transition.command}
              confirmation={transition.consequence}
              onSubmit={async (form) => {
                await adminService.transition(
                  shape.id,
                  [row.id],
                  transition.command,
                  String(form.get('reason')),
                  fieldsFrom(form, transition.fields || []),
                );
                await onChanged();
              }}
            >
              <Textarea label="Decision reason" name="reason" required minLength={5} />
              <AdminFields fields={transition.fields || []} />
            </Mutation>
          ))}
      </div>
      <h3>Audit history</h3>
      <AuditHistory key={row.version} schemaId={shape.id} recordId={row.id} />
    </>
  );
}
function AuditHistory({ schemaId, recordId }: { schemaId?: string; recordId?: string }) {
  const [audit, setAudit] = useState<AdminAudit[] | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      setAudit(await adminService.audit(schemaId, recordId));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [schemaId, recordId]);
  return error ? (
    <Notice error>
      {error}
      <Button onClick={load}>Retry</Button>
    </Notice>
  ) : !audit ? (
    <Skeleton />
  ) : !audit.length ? (
    <p>No audit events yet.</p>
  ) : (
    <ol className="timeline">
      {audit.map((item) => (
        <li key={item.id}>
          <h4>{item.action}</h4>
          <p>{item.reason}</p>
          <small>
            {item.actor} · {item.at}
          </small>
          <details>
            <summary>View recorded changes</summary>
            <pre className="audit-json">{item.before}</pre>
            <pre className="audit-json">{item.after}</pre>
          </details>
        </li>
      ))}
    </ol>
  );
}
function AdminOverview() {
  return <AnalyticsReport />;
}
function CollectionSummary({ path, rows }: { path: string; rows: AdminRecord[] }) {
  const statuses = [...new Set(rows.map((row) => row.status))];
  return (
    <section aria-label="Report summary">
      <h2>{path.endsWith('revenue') ? 'Verified revenue by currency' : 'Current records summary'}</h2>
      <p>
        These figures summarize the fictional records below; the table provides the accessible underlying
        data.
      </p>
      <div className="portal-grid">
        {statuses.map((status) => (
          <Card key={status}>
            <h3>{status}</h3>
            <strong className="metric-value">{rows.filter((row) => row.status === status).length}</strong>
          </Card>
        ))}
        {path.endsWith('statistics') && (
          <Card>
            <h3>Average recorded goal progress</h3>
            <strong>
              {rows.length
                ? Math.round(
                    rows.reduce((sum, row) => sum + Number(row.values.progress || 0), 0) / rows.length,
                  )
                : 0}
              %
            </strong>
          </Card>
        )}
        {path.endsWith('revenue') &&
          [...new Set(rows.map((row) => String(row.values.currency)))].map((currency) => (
            <Card key={currency}>
              <h3>{currency}</h3>
              <strong>
                {(
                  rows
                    .filter(
                      (row) =>
                        row.values.currency === currency && ['Successful', 'Reconciled'].includes(row.status),
                    )
                    .reduce((sum, row) => sum + Number(row.values.amountMinor || 0), 0) / 100
                ).toFixed(2)}
              </strong>
              <p>Settled records only. Pending payments and unconfirmed refund requests are excluded.</p>
            </Card>
          ))}
        {path.endsWith('ledger') && (
          <Card>
            <h3>Recorded net adjustments</h3>
            <strong>
              {rows.reduce((sum, row) => sum + Number(row.values.delta || 0), 0)} Learning Credits
            </strong>
            <p>Original entries and compensating reversals are retained.</p>
          </Card>
        )}
      </div>
    </section>
  );
}
