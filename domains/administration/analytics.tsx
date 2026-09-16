'use client';
import { useEffect, useState } from 'react';
import { Button, Card, Notice, Skeleton } from '../shared/ui';
import { hasPermission, assertPermission, type Permission } from '../portal/permissions';
import { readSession } from '../shared/demo-services';
import { adminService } from './demo-service';
export interface Metric {
  label: string;
  value: string;
  explanation: string;
}
export interface AnalyticsData {
  metrics: Metric[];
  funnel: { stage: string; count: number }[];
}
export interface AnalyticsService {
  read(): Promise<AnalyticsData>;
}
const stages = [
  'REGISTERED',
  'VERIFIED',
  'ACTIVATED',
  'GOAL CREATED',
  'PLAN CREATED',
  'FIRST ACTION',
  '25%',
  '50%',
  '75%',
  'GOAL ACHIEVED',
  'NEXT GOAL',
];
/** Aggregate event fixtures, not claims about live members. The cohort contains no identities. */
export const analyticsService: AnalyticsService = {
  async read() {
    const session = readSession();
    assertPermission(session, 'staff.workspace');
    const cohort = [10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const funnel = stages.map((stage, index) => ({
      stage,
      count: cohort.filter((lastStage) => lastStage >= index).length,
    }));
    const metrics: Metric[] = [];
    const add = (permission: Permission, label: string, value: string | number, explanation: string) => {
      if (hasPermission(session, permission)) metrics.push({ label, value: String(value), explanation });
    };
    [
      ['Registrations', 0],
      ['Activations', 2],
      ['Goals created', 3],
      ['Plans created', 4],
      ['First actions completed', 5],
      ['Goals achieved', 9],
      ['Repeat goals', 10],
    ].forEach(([label, index]) =>
      add(
        'reports.read',
        String(label),
        funnel[Number(index)].count,
        'Count of the demonstration event cohort that reached this stage.',
      ),
    );
    add(
      'reports.read',
      'Progress milestones',
      funnel[6].count + funnel[7].count + funnel[8].count,
      'Total 25%, 50% and 75% events, rather than distinct members.',
    );
    if (hasPermission(session, 'goals.review')) {
      const goals = await adminService.list('goals');
      add(
        'goals.review',
        'At-risk goals',
        goals.filter((item) => item.values.risk === 'At Risk').length,
        'Goal records explicitly marked At Risk.',
      );
      add(
        'goals.review',
        'Recovery rate',
        'No completed recovery cohort',
        'A recovery rate is shown only when resolved interventions provide an eligible denominator.',
      );
    }
    if (hasPermission(session, 'mentorship.manage')) {
      const [mentors, applications, sessions] = await Promise.all([
        adminService.list('mentors'),
        adminService.list('applications'),
        adminService.list('sessions'),
      ]);
      add(
        'mentorship.manage',
        'Active mentors',
        mentors.filter((item) => item.status === 'Active').length,
        'Active mentor records.',
      );
      add(
        'mentorship.manage',
        'Pending applications',
        applications.filter((item) => ['Submitted', 'More information requested'].includes(item.status))
          .length,
        'Applications still awaiting a final decision.',
      );
      add(
        'mentorship.manage',
        'Upcoming sessions',
        sessions.filter(
          (item) =>
            item.status === 'Scheduled' && String(item.values.date) >= new Date().toISOString().slice(0, 10),
        ).length,
        'Scheduled sessions on or after today.',
      );
    }
    add(
      'content.manage',
      'Learning engagement',
      'No learner-event cohort',
      'Content records alone do not prove learner engagement.',
    );
    if (hasPermission(session, 'finance.read')) {
      const payments = await adminService.list('payments');
      add(
        'finance.read',
        'Payment health',
        `${payments.filter((item) => ['Successful', 'Reconciled'].includes(item.status)).length}/${payments.length} settled`,
        'Settlement status from payment records; pending is not successful.',
      );
      add(
        'finance.read',
        'Unreconciled payments',
        payments.filter((item) => item.status !== 'Reconciled').length,
        'Records not yet matched to a provider reconciliation.',
      );
    }
    if (hasPermission(session, 'safety.manage'))
      add(
        'safety.manage',
        'Open safety reports',
        (await adminService.list('safety')).filter((item) => item.status !== 'Resolved').length,
        'Unresolved protected cases.',
      );
    if (hasPermission(session, 'support.manage'))
      add(
        'support.manage',
        'Open support tickets',
        (await adminService.list('support')).filter((item) => item.status !== 'Resolved').length,
        'Unresolved support requests.',
      );
    return { metrics, funnel: hasPermission(session, 'reports.read') ? funnel : [] };
  },
};
export function AnalyticsReport() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      setData(await analyticsService.read());
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  return (
    <>
      <Notice>
        Demonstration analytics. Funnel counts use an explicit fictional event cohort; operational counts use
        the current scoped records.
      </Notice>
      <div className="portal-grid">
        {data.metrics.map((metric) => (
          <Card key={metric.label}>
            <h2>{metric.label}</h2>
            <strong className="metric-value">{metric.value}</strong>
            <p>{metric.explanation}</p>
          </Card>
        ))}
      </div>
      {!!data.funnel.length && (
        <>
          <h2>Goal achievement funnel</h2>
          <p>
            Of {data.funnel[0].count} demonstration registrations, {data.funnel[9].count} reached goal
            achievement and {data.funnel[10].count} started a next goal.
          </p>
          <ol className="funnel-stages">
            {data.funnel.map((item) => (
              <li key={item.stage}>
                <strong>{item.stage}</strong>
                <span>{item.count} members</span>
                <progress
                  aria-label={`${item.stage} cohort count`}
                  value={item.count}
                  max={data.funnel[0].count}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
