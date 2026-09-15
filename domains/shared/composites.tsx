'use client';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { Search, Bell } from 'lucide-react';
import { Button, Card, Field, Modal } from './ui';
export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card>
      <p>{label}</p>
      <strong className="metric-value">{value}</strong>
      {detail && <small>{detail}</small>}
    </Card>
  );
}
export function CircularProgress({ value, label }: { value: number; label: string }) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-label={label}
      className="circular-progress"
      style={{ background: `conic-gradient(var(--primary) ${percentage * 3.6}deg, var(--secondary) 0)` }}
    >
      <span>{percentage}%</span>
    </div>
  );
}
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumbs">
        {items.map((item) => (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="row" aria-label="Pagination">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span aria-live="polite">
        {page} of {pages}
      </span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="switch-control"
      onClick={() => onChange(!checked)}
    >
      <span className={checked ? 'switch-track on' : 'switch-track'}>
        <span />
      </span>
      {label}
    </button>
  );
}
export function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend>{label}</legend>
      {options.map((option) => (
        <label className="check" key={option}>
          <input
            type="radio"
            name={id}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
export function Combobox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <>
      <Field
        label={label}
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <datalist id={id}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}
export function Confirmation({
  title,
  description,
  onConfirm,
  destructive = false,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  const [done, setDone] = useState(false);
  return (
    <Modal title={title} trigger={<Button variant={destructive ? 'destructive' : 'outline'}>{title}</Button>}>
      <p>{description}</p>
      {done ? (
        <p role="status">Done. You can close this dialog.</p>
      ) : (
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          onClick={() => {
            onConfirm();
            setDone(true);
          }}
        >
          Confirm
        </Button>
      )}
    </Modal>
  );
}
export function SearchPalette({ items }: { items: { label: string; href: string }[] }) {
  const [query, setQuery] = useState('');
  return (
    <Modal
      title="Search the platform"
      trigger={
        <Button variant="outline">
          <Search size={18} />
          Search
        </Button>
      }
    >
      <Field label="Find a page" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul className="search-results">
        {items
          .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
          .map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
      </ul>
    </Modal>
  );
}
export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: Record<string, ReactNode>[];
  caption: string;
}) {
  return (
    <div className="responsive-table">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td data-label={column} key={column}>
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Timeline({ items }: { items: { title: string; date: string; detail: string }[] }) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.date}-${item.title}`}>
          <time>{item.date}</time>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </li>
      ))}
    </ol>
  );
}
export function NotificationItem({
  title,
  detail,
  href,
  unread,
}: {
  title: string;
  detail: string;
  href: string;
  unread?: boolean;
}) {
  return (
    <Link href={href} className="notification-item">
      <Bell size={20} />
      <span>
        <strong>{title}</strong>
        {unread && <span className="sr-only">Unread</span>}
        <small>{detail}</small>
      </span>
    </Link>
  );
}
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="status" className="toast">
      <span>{message}</span>
      <Button variant="ghost" onClick={onDismiss}>
        Dismiss
      </Button>
    </div>
  );
}
