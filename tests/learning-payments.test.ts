import { beforeEach, describe, expect, it } from 'vitest';
import { saveSession } from '../domains/shared/demo-services';
import {
  paymentService,
  financialKey,
  readCreditAccount,
  writeCreditAccount,
} from '../domains/payments/demo-service';
import { learningService } from '../domains/learning/demo-service';
beforeEach(() =>
  saveSession({
    id: 'learner',
    email: 'learner@example.test',
    role: 'member',
    status: 'active',
    expiresAt: Date.now() + 60000,
  }),
);
describe('learning and credit boundaries', () => {
  it('does not manufacture credits from checkout or a browser success redirect', async () => {
    const payment = await paymentService.create({
      amountMinor: 10000,
      purpose: 'credits',
      idempotencyKey: 'first',
    });
    expect(
      (await paymentService.create({ amountMinor: 10000, purpose: 'credits', idempotencyKey: 'first' })).id,
    ).toBe(payment.id);
    await paymentService.checkout(payment.id);
    window.history.replaceState({}, '', '/app/payments?success=true&status=Successful');
    expect((await paymentService.check(payment.id)).status).toBe('Pending');
    expect((await paymentService.account()).available).toBe(0);
    await expect(paymentService.receipt(payment.id)).rejects.toThrow('settlement');
  });
  it('gates paid lessons and debits an eligible credit purchase once', async () => {
    await expect(learningService.start('demo-mini-course')).rejects.toThrow('Purchase');
    await expect(learningService.purchaseWithCredits('demo-mini-course', 'p1')).rejects.toThrow(
      'Insufficient',
    );
    // A trusted-provider fixture, outside the presentation code, supplies a settled balance.
    const key = await financialKey();
    const account = readCreditAccount(key);
    account.available = 100;
    account.ledger.push({
      id: 'settlement',
      at: new Date().toISOString(),
      delta: 100,
      balance: 100,
      reference: 'provider-fixture',
      description: 'Verified provider fixture',
      kind: 'Top-up',
    });
    writeCreditAccount(key, account);
    expect((await learningService.purchaseWithCredits('demo-mini-course', 'p1')).purchased).toBe(true);
    await learningService.purchaseWithCredits('demo-mini-course', 'p1');
    expect((await paymentService.account()).available).toBe(0);
    expect((await paymentService.account()).ledger.filter((entry) => entry.kind === 'Purchase')).toHaveLength(
      1,
    );
  });
  it('requires lesson and quiz completion before issuing an eligible certificate', async () => {
    await learningService.start('demo-quiz');
    const lesson = await learningService.completeLesson('demo-quiz', 'outcome');
    expect(lesson.state).toBe('In progress');
    expect((await learningService.submitQuiz('demo-quiz', { q1: 0 })).record.state).toBe('In progress');
    expect((await learningService.submitQuiz('demo-quiz', { q1: 1 })).record.state).toBe('Completed');
    await expect(learningService.certificate('demo-mini-course')).rejects.toThrow('only after');
    await learningService.bookmark('demo-article', true);
    expect(
      (await learningService.library()).records.find((item) => item.materialId === 'demo-article')
        ?.bookmarked,
    ).toBe(true);
  });
});
