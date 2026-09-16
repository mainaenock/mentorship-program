export type MaterialType =
  | 'Article'
  | 'PDF'
  | 'Video'
  | 'Audio'
  | 'Worksheet'
  | 'Template'
  | 'Quiz'
  | 'Mini-course'
  | 'Assessment'
  | 'External resource';
export type LearningState = 'Not started' | 'In progress' | 'Completed';
export interface Lesson {
  id: string;
  title: string;
  body: string;
  sourceUrl?: string;
  transcript?: string;
}
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Material {
  id: string;
  title: string;
  description: string;
  author: string;
  type: MaterialType;
  duration: number;
  level: string;
  category: string;
  goalsSupported: string[];
  priceMinor: number | null;
  creditsCost: number | null;
  currency: string;
  featured: boolean;
  published: boolean;
  downloadAllowed: boolean;
  downloadUrl?: string;
  preview: string;
  lessons: Lesson[];
  questions: Question[];
  reviewsEnabled: boolean;
  certificateEnabled: boolean;
}
export interface LearningRecord {
  materialId: string;
  state: LearningState;
  completedLessonIds: string[];
  bookmarked: boolean;
  purchased: boolean;
  attachedGoalIds: string[];
  quizScore?: number;
  completedAt?: string;
}
export interface LearningLibrary {
  materials: Material[];
  records: LearningRecord[];
  categories: string[];
}
export interface LearningService {
  library(): Promise<LearningLibrary>;
  bookmark(id: string, value: boolean): Promise<LearningRecord>;
  start(id: string): Promise<LearningRecord>;
  completeLesson(id: string, lessonId: string): Promise<LearningRecord>;
  submitQuiz(
    id: string,
    answers: Record<string, number>,
  ): Promise<{
    record: LearningRecord;
    feedback: { question: string; correct: boolean; explanation: string }[];
  }>;
  attach(id: string, goalId: string): Promise<LearningRecord>;
  purchaseWithCredits(id: string, idempotencyKey: string): Promise<LearningRecord>;
  certificate(id: string): Promise<{ title: string; completedAt: string; reference: string }>;
}
