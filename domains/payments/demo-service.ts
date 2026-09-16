'use client';
import { readSession } from '../shared/demo-services';
import { assertPermission } from '../portal/permissions';
import type { CreditAccount, Payment, PaymentService } from './contracts';
export async function financialKey() {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (!navigator.onLine) throw new Error('You are offline. No payment has been confirmed.');
  const session = readSession();
  assertPermission(session, 'member.self');
  return `gap-finance:${session.id}`;
}
export function readCreditAccount(key: string): CreditAccount {
  return (
    (JSON.parse(sessionStorage.getItem(key) || 'null') as CreditAccount) || {
      available: 0,
      ledger: [],
      payments: [],
      topUps: [
        { amountMinor: 10000, credits: 100 },
        { amountMinor: 50000, credits: 500 },
      ],
      customAllowed: false,
      currency: 'KES',
      refundRule:
        'Demonstration: refund requests are reviewed before a ledger adjustment. Published refund rules must be configured before launch.',
      expiryRule:
        'No expiry is applied to demonstration credits. Production expiry rules must be disclosed before purchase.',
    }
  );
}
export function writeCreditAccount(key: string, account: CreditAccount) {
  sessionStorage.setItem(key, JSON.stringify(account));
}
function find(account: CreditAccount, id: string) {
  const payment = account.payments.find((item) => item.id === id);
  if (!payment) throw new Error('Payment not found in your account.');
  return payment;
}
export const paymentService: PaymentService = {
  async account() {
    return readCreditAccount(await financialKey());
  },
  async create(input) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const existing = account.payments.find((item) => item.id === `DEMO-${input.idempotencyKey}`);
    if (existing) return existing;
    const offer = account.topUps.find((item) => item.amountMinor === input.amountMinor);
    if (input.purpose !== 'credits' || !offer) throw new Error('Choose a configured demonstration top-up.');
    const payment: Payment = {
      id: `DEMO-${input.idempotencyKey}`,
      ownerId: readSession()!.id,
      amountMinor: offer.amountMinor,
      currency: account.currency,
      credits: offer.credits,
      purpose: 'credits',
      status: 'Created',
      createdAt: new Date().toISOString(),
      refundedMinor: 0,
      refundRequested: false,
    };
    account.payments.unshift(payment);
    writeCreditAccount(key, account);
    return payment;
  },
  async checkout(id) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const payment = find(account, id);
    if (payment.status !== 'Created') throw new Error('Only a newly created payment can begin checkout.');
    payment.status = 'Awaiting payment';
    writeCreditAccount(key, account);
    return { payment, url: null, demo: true };
  },
  async check(id) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const payment = find(account, id);
    payment.checkedAt = new Date().toISOString();
    // No provider is connected: checking or visiting a success URL never manufactures settlement.
    if (payment.status === 'Awaiting payment') payment.status = 'Pending';
    writeCreditAccount(key, account);
    return payment;
  },
  async retry(id) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const payment = find(account, id);
    if (!['Failed', 'Abandoned'].includes(payment.status))
      throw new Error('Only failed or abandoned payments can be retried.');
    payment.status = 'Created';
    writeCreditAccount(key, account);
    return payment;
  },
  async requestRefund(id, reason) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const payment = find(account, id);
    if (!['Successful', 'Partially refunded'].includes(payment.status) || !reason.trim())
      throw new Error('A settled payment and refund reason are required.');
    payment.refundRequested = true;
    writeCreditAccount(key, account);
    return payment;
  },
  async receipt(id) {
    const payment = find(await this.account(), id);
    if (!['Successful', 'Partially refunded', 'Refunded', 'Reversed'].includes(payment.status))
      throw new Error('A receipt is available after verified settlement.');
    return payment;
  },
};
