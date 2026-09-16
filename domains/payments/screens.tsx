'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Notice, Select, Skeleton, Textarea } from '../shared/ui';
import { DataTable } from '../shared/composites';
import { Mutation } from '../goals/screens';
import { paymentService } from './demo-service';
import type { CreditAccount, PaymentStatus } from './contracts';
import { downloadText } from '../learning/screens';
const statuses: PaymentStatus[] = [
  'Created',
  'Awaiting payment',
  'Pending',
  'Successful',
  'Failed',
  'Abandoned',
  'Reversed',
  'Refunded',
  'Partially refunded',
];
export function Payments({
  history = false,
  paymentsOnly = false,
}: {
  history?: boolean;
  paymentsOnly?: boolean;
}) {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    setError('');
    try {
      setAccount(await paymentService.account());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!account)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  const money = (minor: number) => `${account.currency} ${(minor / 100).toFixed(2)}`;
  async function operate(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      {message && <Notice>{message}</Notice>}
      <Notice>
        Learning Credits are non-transferable, non-withdrawable and usable only for eligible platform
        purchases. Demonstration amounts are not published commercial pricing.
      </Notice>
      {!paymentsOnly && (
        <Card>
          <p>Available Learning Credits</p>
          <strong className="metric-value">{account.available}</strong>
          <p>{account.refundRule}</p>
          <p>{account.expiryRule}</p>
          <Link href="/refund-policy">Published refund policy</Link>
          <div className="actions">
            <Link href="/app/credits/history">Transaction history</Link>
            <Link href="/app/payments">Payments and receipts</Link>
            <Link href="/app/learning">Browse eligible learning</Link>
          </div>
        </Card>
      )}
      {!history && !paymentsOnly && (
        <Card>
          <h2>Add Credits</h2>
          <label className="field">
            Choose Amount
            <select value={amount} onChange={(e) => setAmount(e.target.value)}>
              <option value="">Choose a top-up</option>
              {account.topUps.map((offer) => (
                <option key={offer.amountMinor} value={offer.amountMinor}>
                  {money(offer.amountMinor)} · {offer.credits} Learning Credits
                </option>
              ))}
            </select>
          </label>
          {account.customAllowed && (
            <Field
              label="Custom top-up in minor currency units"
              type="number"
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
          <Button
            loading={busy}
            disabled={!amount}
            onClick={() => {
              void operate(async () => {
                const payment = await paymentService.create({
                  amountMinor: Number(amount.split(':')[0]),
                  purpose: 'credits',
                  idempotencyKey: crypto.randomUUID(),
                });
                setMessage(`Payment ${payment.id} created. Continue to checkout below.`);
              });
            }}
          >
            Add Credits
          </Button>
        </Card>
      )}
      {!paymentsOnly && (
        <>
          <h2>Auditable credit ledger</h2>
          {!account.ledger.length ? (
            <Card>
              <h3>No credit transactions yet</h3>
              <p>
                Only verified settlement or authorized adjustments can add credits. Returning to a success URL
                does not change your balance.
              </p>
            </Card>
          ) : (
            <DataTable
              caption="Learning Credits transaction history"
              columns={['Date', 'Description', 'Change', 'Balance', 'Reference']}
              rows={account.ledger.map((entry) => ({
                Date: entry.at,
                Description: entry.description,
                Change: `${entry.delta > 0 ? '+' : ''}${entry.delta}`,
                Balance: entry.balance,
                Reference: entry.reference,
              }))}
            />
          )}
        </>
      )}
      <h2>Payments</h2>
      <div className="portal-toolbar">
        <Field
          label="Search payment reference"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Payment status"
          options={['All', ...statuses]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {!account.payments.filter(
        (payment) =>
          (filter === 'All' || payment.status === filter) &&
          payment.id.toLowerCase().includes(query.toLowerCase()),
      ).length && (
        <Card>
          <h3>No matching payments</h3>
          <p>New payments and their verified outcomes will appear here.</p>
        </Card>
      )}
      {account.payments
        .filter(
          (payment) =>
            (filter === 'All' || payment.status === filter) &&
            payment.id.toLowerCase().includes(query.toLowerCase()),
        )
        .map((payment) => (
          <Card key={payment.id}>
            <Badge>{payment.status}</Badge>
            <h3>
              {money(payment.amountMinor)} · {payment.credits} Learning Credits
            </h3>
            <p className="payment-reference">{payment.id}</p>
            <p>{payment.createdAt}</p>
            {payment.refundRequested && (
              <Notice>Refund request awaiting review. Your balance has not been changed.</Notice>
            )}
            {payment.refundedMinor > 0 && <p>Refunded: {money(payment.refundedMinor)}</p>}
            <div className="actions">
              {payment.status === 'Created' && (
                <Button
                  loading={busy}
                  onClick={() => {
                    void operate(async () => {
                      const checkout = await paymentService.checkout(payment.id);
                      if (checkout.demo)
                        setMessage(
                          'Paystack is not connected in this demonstration. No money was collected. The payment remains unconfirmed until a trusted provider result is available.',
                        );
                    });
                  }}
                >
                  Continue to Paystack
                </Button>
              )}
              {['Awaiting payment', 'Pending', 'Created'].includes(payment.status) && (
                <Button
                  variant="outline"
                  loading={busy}
                  onClick={() => {
                    void operate(async () => {
                      const checked = await paymentService.check(payment.id);
                      setMessage(
                        `Verified adapter status: ${checked.status}. Credits are not granted while settlement is unconfirmed.`,
                      );
                    });
                  }}
                >
                  Check Payment Status
                </Button>
              )}
              {['Failed', 'Abandoned'].includes(payment.status) && (
                <Button
                  loading={busy}
                  onClick={() => {
                    void operate(async () => {
                      await paymentService.retry(payment.id);
                    });
                  }}
                >
                  Retry Payment
                </Button>
              )}
              {['Successful', 'Refunded', 'Partially refunded', 'Reversed'].includes(payment.status) && (
                <Mutation
                  title="View Receipt"
                  onSubmit={async () => {
                    const receipt = await paymentService.receipt(payment.id);
                    downloadText(
                      `${receipt.id}.txt`,
                      `DEMONSTRATION RECEIPT\nReference: ${receipt.id}\nStatus: ${receipt.status}\nAmount: ${money(receipt.amountMinor)}\nRefunded: ${money(receipt.refundedMinor)}\nCreated: ${receipt.createdAt}`,
                    );
                  }}
                >
                  <p>Download the demonstration receipt for this verified payment record.</p>
                </Mutation>
              )}
              {['Successful', 'Partially refunded'].includes(payment.status) && !payment.refundRequested && (
                <Mutation
                  title="Request Refund"
                  confirmation="Your request will be reviewed under the refund policy. Submitting this request does not issue money or Learning Credits."
                  onSubmit={async (data) => {
                    await paymentService.requestRefund(payment.id, String(data.get('reason')));
                    await load();
                  }}
                >
                  <Textarea label="Refund reason" name="reason" required />
                </Mutation>
              )}
              <Link href="/app/support">Contact Support</Link>
            </div>
          </Card>
        ))}
    </>
  );
}
