'use client';
import { financialKey, readCreditAccount, writeCreditAccount } from '../payments/demo-service';
import { goalService } from '../goals/demo-service';
import type { LearningRecord, LearningService } from './contracts';
import { demoMaterials } from './fixtures';
function records(key: string): LearningRecord[] {
  return JSON.parse(sessionStorage.getItem(`${key}:learning`) || '[]') as LearningRecord[];
}
function save(key: string, all: LearningRecord[]) {
  sessionStorage.setItem(`${key}:learning`, JSON.stringify(all));
}
function material(id: string) {
  const item = demoMaterials.find((item) => item.id === id && item.published);
  if (!item) throw new Error('Material not found.');
  return item;
}
function record(all: LearningRecord[], id: string): LearningRecord {
  material(id);
  let item = all.find((item) => item.materialId === id);
  if (!item) {
    item = {
      materialId: id,
      state: 'Not started',
      completedLessonIds: [],
      bookmarked: false,
      purchased: false,
      attachedGoalIds: [],
    };
    all.push(item);
  }
  return item;
}
async function mutate(id: string, fn: (item: LearningRecord) => void, requireAccess = false) {
  const key = await financialKey();
  const all = records(key);
  const item = record(all, id);
  if (requireAccess && material(id).priceMinor !== 0 && !item.purchased)
    throw new Error('Purchase this material before starting it.');
  fn(item);
  save(key, all);
  return structuredClone(item);
}
function completeIfReady(item: LearningRecord) {
  const source = material(item.materialId);
  const complete =
    source.lessons.every((lesson) => item.completedLessonIds.includes(lesson.id)) &&
    (!source.questions.length || item.quizScore === 100);
  item.state = complete ? 'Completed' : 'In progress';
  if (complete) item.completedAt = new Date().toISOString();
}
export const learningService: LearningService = {
  async library() {
    const key = await financialKey();
    return {
      materials: structuredClone(demoMaterials),
      records: records(key),
      categories: [...new Set(demoMaterials.map((item) => item.category))],
    };
  },
  async bookmark(id, value) {
    return mutate(id, (item) => {
      item.bookmarked = value;
    });
  },
  async start(id) {
    return mutate(
      id,
      (item) => {
        if (item.state === 'Not started') item.state = 'In progress';
      },
      true,
    );
  },
  async completeLesson(id, lessonId) {
    return mutate(
      id,
      (item) => {
        if (!material(id).lessons.some((lesson) => lesson.id === lessonId))
          throw new Error('Lesson not found.');
        if (!item.completedLessonIds.includes(lessonId)) item.completedLessonIds.push(lessonId);
        completeIfReady(item);
      },
      true,
    );
  },
  async submitQuiz(id, answers) {
    const source = material(id);
    if (
      !source.questions.length ||
      source.questions.some(
        (q) => !Number.isInteger(answers[q.id]) || answers[q.id] < 0 || answers[q.id] >= q.options.length,
      )
    )
      throw new Error('Answer every question before submitting.');
    const feedback = source.questions.map((q) => ({
      question: q.prompt,
      correct: answers[q.id] === q.answer,
      explanation: q.explanation,
    }));
    const item = await mutate(
      id,
      (item) => {
        item.quizScore = Math.round(
          (feedback.filter((result) => result.correct).length / feedback.length) * 100,
        );
        completeIfReady(item);
      },
      true,
    );
    return { record: item, feedback };
  },
  async attach(id, goalId) {
    if (!(await goalService.get(goalId))) throw new Error('Choose one of your own goals.');
    return mutate(id, (item) => {
      if (!item.attachedGoalIds.includes(goalId)) item.attachedGoalIds.push(goalId);
    });
  },
  async purchaseWithCredits(id, idempotencyKey) {
    const key = await financialKey();
    const account = readCreditAccount(key);
    const all = records(key);
    const item = record(all, id);
    const source = material(id);
    if (item.purchased) return item;
    if (!source.creditsCost || source.creditsCost <= 0)
      throw new Error('This material does not require a credit purchase.');
    if (account.available < source.creditsCost)
      throw new Error('Insufficient Learning Credits. Add credits or choose a free resource.');
    if (account.ledger.some((entry) => entry.reference === idempotencyKey))
      throw new Error('This purchase reference has already been used.');
    account.available -= source.creditsCost;
    account.ledger.unshift({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      delta: -source.creditsCost,
      balance: account.available,
      description: `Learning purchase: ${source.title}`,
      reference: idempotencyKey,
      kind: 'Purchase',
    });
    item.purchased = true;
    writeCreditAccount(key, account);
    save(key, all);
    return item;
  },
  async certificate(id) {
    const key = await financialKey();
    const item = records(key).find((item) => item.materialId === id);
    const source = material(id);
    if (!source.certificateEnabled || item?.state !== 'Completed' || !item.completedAt)
      throw new Error('A certificate is available only after completing an eligible learning path.');
    return { title: source.title, completedAt: item.completedAt, reference: `DEMO-CERT-${id}` };
  },
};
