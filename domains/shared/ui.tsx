'use client';
import Link from 'next/link';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import { config } from './config';
export function IconButton({ label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Button
      variant="ghost"
      aria-label={label}
      {...props}
      className={`icon-button ${props.className || ''}`}
    />
  );
}
export function PhoneInput(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <Field
      {...props}
      type="tel"
      autoComplete="tel"
      placeholder={props.placeholder || config.phonePlaceholder}
    />
  );
}
export function DatePicker(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <Field {...props} type="date" />;
}
export function FileUpload(props: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <Field {...props} type="file" />;
}
export function UserMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <Menu
      trigger={
        <Button variant="ghost" aria-label={`Account menu for ${name}`}>
          <Avatar name={name} />
          {name}
        </Button>
      }
      items={[{ label: 'Log out', action: onLogout }]}
    />
  );
}
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
export function SafeForm({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  const ready = useHydrated();
  return (
    <form {...props} method="post">
      <fieldset disabled={!ready} className="form-fields">
        {children}
      </fieldset>
      <noscript>Enable JavaScript to use this form. No details have been submitted.</noscript>
    </form>
  );
}
export function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  loading?: boolean;
}) {
  const ready = useHydrated();
  return (
    <button
      className={`button ${variant} ${className}`}
      {...props}
      disabled={!ready || loading || props.disabled}
    >
      {loading && <LoaderCircle size={18} className="spin" />}
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? 'outline' : 'primary'}`} href={href}>
      {children}
    </Link>
  );
}
export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = useId();
  const ready = useHydrated();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
        disabled={!ready || props.disabled}
      />
      {error && (
        <span role="alert" className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
export function Password({
  label = 'Password',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password">
        <input id={id} type={show ? 'text' : 'password'} {...props} />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}
export function Select({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        <option value="">Select an option</option>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={4} {...props} />
    </div>
  );
}
export function Check({
  children,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  );
}
export function Badge({ children, tone = 'success' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="row between">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <progress value={value} max={100} aria-label={label} />
    </div>
  );
}
export function Modal({
  trigger,
  title,
  children,
  drawer = false,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  drawer?: boolean;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className={drawer ? 'drawer' : 'dialog'}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description className="sr-only">{title} options</Dialog.Description>
          <Dialog.Close className="icon-button dialog-close" aria-label="Close">
            <X />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip">{text}</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
export function Tabs({ items }: { items: { title: string; content: ReactNode }[] }) {
  return (
    <TabsPrimitive.Root defaultValue={items[0]?.title}>
      <TabsPrimitive.List className="tabs">
        {items.map((item) => (
          <TabsPrimitive.Trigger key={item.title} value={item.title}>
            {item.title}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content key={item.title} value={item.title}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
export function Menu({
  trigger,
  items,
}: {
  trigger: ReactNode;
  items: { label: string; action: () => void }[];
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="dropdown">
          {items.map((item) => (
            <Dropdown.Item key={item.label} onSelect={item.action}>
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Skeleton() {
  return <div role="status" className="skeleton" aria-label="Loading content" />;
}
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(current);
  useEffect(() => {
    if (previous.current !== current) heading.current?.focus();
    previous.current = current;
  }, [current]);
  return (
    <div className="stepper">
      <p className="eyebrow">
        Step {current + 1} of {steps.length}
      </p>
      <h2 ref={heading} tabIndex={-1}>
        {steps[current]}
      </h2>
      <progress max={steps.length} value={current + 1} aria-label="Setup progress" />
    </div>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-label={name}>
      {name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')}
    </span>
  );
}
export function Accordion({ items }: { items: { title: string; content: ReactNode }[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.title}>
          <summary>{item.title}</summary>
          <div>{item.content}</div>
        </details>
      ))}
    </div>
  );
}
export function DataList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="data-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div>
      <Notice error>{message}</Notice>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
