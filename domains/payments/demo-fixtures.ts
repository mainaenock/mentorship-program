'use client';
import type { PaymentStatus } from './contracts';
import { financialKey, readCreditAccount, writeCreditAccount } from './demo-service';
import { readSession } from '../shared/demo-services';
import { config } from '../shared/config';
/** Only the explicit fictional workspace entry uses this trusted-provider scenario fixture. */
export async function seedPaymentFixtures(): Promise<void> {
  if (!config.demo || readSession()?.id !== 'demo-workspace-member') return;
  const key = await financialKey();
  const account = readCreditAccount(key);
  if (account.payments.length || account.ledger.length) return;
  const states: PaymentStatus[] = [
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
  for (const [index, status] of states.entries()) {
    const id = `DEMO-FIXTURE-${index + 1}`;
    const at = `2026-09-${String(index + 1).padStart(2, '0')}T09:00:00Z`;
    account.payments.push({
      id,
      ownerId: readSession()!.id,
      amountMinor: 10000,
      currency: 'KES',
      status,
      purpose: 'credits',
      credits: 100,
      createdAt: at,
      providerReference: `fictional-provider-${index}`,
      refundedMinor:
        status === 'Refunded' || status === 'Reversed' ? 10000 : status === 'Partially refunded' ? 5000 : 0,
      refundRequested: false,
    });
    if (['Successful', 'Reversed', 'Refunded', 'Partially refunded'].includes(status)) {
      account.available += 100;
      account.ledger.push({
        id: `${id}-credit`,
        at,
        description: 'Fictional provider settlement fixture',
        delta: 100,
        balance: account.available,
        reference: id,
        kind: 'Top-up',
      });
      if (status !== 'Successful') {
        const delta = status === 'Partially refunded' ? -50 : -100;
        account.available += delta;
        account.ledger.push({
          id: `${id}-return`,
          at,
          description: `Fictional ${status.toLowerCase()} fixture`,
          delta,
          balance: account.available,
          reference: id,
          kind: status === 'Reversed' ? 'Reversal' : 'Refund',
        });
      }
    }
  }
  writeCreditAccount(key, account);
}
