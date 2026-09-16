'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ActionLink,
  Badge,
  Button,
  Card,
  Field,
  Modal,
  Notice,
  SafeForm,
  Select,
  Skeleton,
} from '../shared/ui';
import { Mutation } from '../goals/screens';
import { goalService } from '../goals/demo-service';
import { learningService } from './demo-service';
import type { LearningLibrary, LearningRecord, Material } from './contracts';

export function Learning({
  id,
  player = false,
  mine = false,
}: {
  id?: string;
  player?: boolean;
  mine?: boolean;
}) {
  const [library, setLibrary] = useState<LearningLibrary | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [filter, setFilter] = useState('All');
  const [goals, setGoals] = useState<{ id: string; title: string }[]>([]);
  async function load() {
    setError('');
    try {
      const [data, ownedGoals] = await Promise.all([learningService.library(), goalService.list()]);
      setLibrary(data);
      setGoals(ownedGoals);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [id]);
  if (!library)
    return error ? (
      <Notice error>
        {error}
        <Button onClick={load}>Retry</Button>
      </Notice>
    ) : (
      <Skeleton />
    );
  function update(record: LearningRecord) {
    setLibrary((old) =>
      old
        ? {
            ...old,
            records: [...old.records.filter((item) => item.materialId !== record.materialId), record],
          }
        : old,
    );
  }
  const material = library.materials.find((item) => item.id === id);
  const record = library.records.find((item) => item.materialId === id);
  if (id && !material)
    return (
      <Card>
        <h2>Material not found</h2>
        <Link href="/app/learning">Return to learning</Link>
      </Card>
    );
  if (material)
    return (
      <>
        <Badge>
          {material.type} · {record?.state || 'Not started'}
        </Badge>
        <h2>{material.title}</h2>
        <p>{material.description}</p>
        {player ? (
          <LearningPlayer material={material} record={record} onChange={update} />
        ) : (
          <>
            <Card>
              <dl>
                <dt>Author</dt>
                <dd>{material.author}</dd>
                <dt>Duration and level</dt>
                <dd>
                  {material.duration} minutes · {material.level}
                </dd>
                <dt>Category</dt>
                <dd>{material.category}</dd>
                <dt>Goals supported</dt>
                <dd>{material.goalsSupported.join(', ')}</dd>
                <dt>Price</dt>
                <dd>
                  {material.priceMinor === 0
                    ? 'Free'
                    : material.priceMinor === null
                      ? 'Price not configured'
                      : `Demo price: ${material.currency} ${(material.priceMinor / 100).toFixed(2)} · ${material.creditsCost} Learning Credits`}
                </dd>
              </dl>
              <Notice>
                These are authored demonstration materials and fixture prices, not published commercial
                offers.
              </Notice>
            </Card>
            <div className="actions">
              <Modal title="Preview" trigger={<Button variant="outline">Preview</Button>}>
                <p>{material.preview}</p>
              </Modal>
              {material.priceMinor === 0 || record?.purchased ? (
                <ActionLink href={`/app/learning/${id}/learn`}>
                  {record?.state === 'In progress' ? 'Continue Learning' : 'Start Learning'}
                </ActionLink>
              ) : (
                <Mutation
                  title="Purchase"
                  confirmation={`This uses ${material.creditsCost} non-transferable Learning Credits. Review the published refund rules before a real purchase.`}
                  onSubmit={async () =>
                    update(await learningService.purchaseWithCredits(material.id, crypto.randomUUID()))
                  }
                >
                  <p>Use Learning Credits for this eligible demonstration resource.</p>
                  <Link href="/app/credits">Add Learning Credits</Link>
                </Mutation>
              )}
              <Mutation
                title={record?.bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                onSubmit={async () =>
                  update(await learningService.bookmark(material.id, !record?.bookmarked))
                }
              />
              <Mutation
                title="Attach to Goal"
                onSubmit={async (data) =>
                  update(await learningService.attach(material.id, String(data.get('goal'))))
                }
              >
                <label className="field">
                  Choose goal
                  <select required name="goal">
                    <option value="">Select a goal</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </label>
                {!goals.length && <Link href="/app/goals/new">Create New Goal</Link>}
              </Mutation>
            </div>
            <h3>Related materials</h3>
            <div className="portal-grid">
              {library.materials
                .filter((item) => item.category === material.category && item.id !== material.id)
                .slice(0, 3)
                .map((item) => (
                  <MaterialCard key={item.id} material={item} />
                ))}
            </div>
          </>
        )}
      </>
    );
  const filtered = library.materials.filter((material) => {
    const record = library.records.find((item) => item.materialId === material.id);
    return (
      (!mine || !!record) &&
      `${material.title} ${material.description}`.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'All' || material.category === category) &&
      (filter === 'All' ||
        (filter === 'Featured' && material.featured) ||
        (filter === 'Free' && material.priceMinor === 0) ||
        (filter === 'Paid' && material.priceMinor !== 0) ||
        (filter === 'Bookmarks' && record?.bookmarked) ||
        (filter === 'Purchased' && record?.purchased) ||
        filter === (record?.state || 'Not started'))
    );
  });
  return (
    <>
      <Notice>Demonstration library · authored samples with clearly labelled fixture prices.</Notice>
      <div className="portal-toolbar">
        <Field
          label="Search learning"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          label="Learning category"
          options={['All', ...library.categories]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          label="Learning filter"
          options={[
            'All',
            'Featured',
            'Free',
            'Paid',
            'Bookmarks',
            'Purchased',
            'Not started',
            'In progress',
            'Completed',
          ]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="actions">
        <Link href="/app/my-learning">My Learning</Link>
        <Link href="/app/learning">All materials</Link>
      </div>
      {!filtered.length && (
        <Card>
          <h2>No matching materials</h2>
          <p>Try another search, category or progress filter.</p>
        </Card>
      )}
      <div className="portal-grid">
        {filtered.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            record={library.records.find((item) => item.materialId === material.id)}
          />
        ))}
      </div>
    </>
  );
}
function MaterialCard({ material, record }: { material: Material; record?: LearningRecord }) {
  return (
    <Card>
      <Badge>{material.type}</Badge>
      <h3>
        <Link href={`/app/learning/${material.id}`}>{material.title}</Link>
      </h3>
      <p>{material.preview}</p>
      <p>
        {material.duration} minutes · {material.level} ·{' '}
        {material.priceMinor === 0 ? 'Free' : 'Paid demonstration'}
      </p>
      <p>
        {record?.state || 'Not started'}
        {record?.bookmarked ? ' · Bookmarked' : ''}
      </p>
      <ActionLink href={`/app/learning/${material.id}`} secondary>
        View Learning
      </ActionLink>
    </Card>
  );
}
function LearningPlayer({
  material,
  record,
  onChange,
}: {
  material: Material;
  record?: LearningRecord;
  onChange: (record: LearningRecord) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ question: string; correct: boolean; explanation: string }[]>([]);
  useEffect(() => {
    void learningService
      .start(material.id)
      .then(onChange)
      .catch((e: Error) => setError(e.message));
  }, [material.id]);
  if (material.priceMinor !== 0 && !record?.purchased)
    return (
      <Notice>
        Purchase is required to access this material.{' '}
        <Link href={`/app/learning/${material.id}`}>View purchase options</Link>
      </Notice>
    );
  async function finish(lessonId: string) {
    setBusy(true);
    setError('');
    try {
      onChange(await learningService.completeLesson(material.id, lessonId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && <Notice error>{error}</Notice>}
      <progress
        max={material.lessons.length}
        value={record?.completedLessonIds.length || 0}
        aria-label="Learning progress"
      />
      <p>
        {record?.completedLessonIds.length || 0} of {material.lessons.length} lessons complete
      </p>
      {material.lessons.map((lesson) => (
        <Card key={lesson.id}>
          <h3>{lesson.title}</h3>
          <p>{lesson.body}</p>
          {material.type === 'Video' &&
            (lesson.sourceUrl ? (
              <video controls preload="metadata" aria-label={lesson.title} src={lesson.sourceUrl}>
                <track kind="captions" />
              </video>
            ) : (
              <Notice>No approved video source is configured. The text lesson remains available.</Notice>
            ))}
          {material.type === 'Audio' &&
            (lesson.sourceUrl ? (
              <audio controls preload="metadata" aria-label={lesson.title} src={lesson.sourceUrl} />
            ) : (
              <Notice>No approved audio source is configured. The text lesson remains available.</Notice>
            ))}
          {lesson.transcript && (
            <details>
              <summary>Transcript</summary>
              <p>{lesson.transcript}</p>
            </details>
          )}
          {material.type === 'PDF' &&
            (lesson.sourceUrl ? (
              <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
                Open accessible PDF
              </a>
            ) : (
              <Notice>No approved PDF file is configured.</Notice>
            ))}
          {material.type === 'External resource' &&
            (lesson.sourceUrl ? (
              <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
                Open external resource
              </a>
            ) : (
              <Notice>No external resource URL is configured.</Notice>
            ))}
          {material.downloadAllowed && (
            <Button
              variant="outline"
              onClick={() =>
                downloadText(
                  `${material.title}.txt`,
                  `${material.title}\n\n${lesson.body}\n\nMy outcome:\n\nMy next action:\n\nWhen I will do it:\n`,
                )
              }
            >
              Download
            </Button>
          )}
          <Button
            loading={busy}
            disabled={record?.completedLessonIds.includes(lesson.id)}
            onClick={() => {
              void finish(lesson.id);
            }}
          >
            {record?.completedLessonIds.includes(lesson.id) ? 'Completed' : 'Mark Complete'}
          </Button>
        </Card>
      ))}
      {!!material.questions.length && (
        <Card>
          <h3>Take Quiz</h3>
          <SafeForm
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError('');
              try {
                const result = await learningService.submitQuiz(material.id, answers);
                onChange(result.record);
                setFeedback(result.feedback);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {material.questions.map((question) => (
              <fieldset key={question.id}>
                <legend>{question.prompt}</legend>
                {question.options.map((option, index) => (
                  <label className="check" key={option}>
                    <input
                      type="radio"
                      name={question.id}
                      required
                      checked={answers[question.id] === index}
                      onChange={() => setAnswers({ ...answers, [question.id]: index })}
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
            <Button type="submit" loading={busy}>
              Submit Quiz
            </Button>
          </SafeForm>
          {feedback.map((item) => (
            <Notice key={item.question}>
              {item.correct ? 'Correct' : 'Review this answer'} · {item.explanation}
            </Notice>
          ))}
        </Card>
      )}
      {material.certificateEnabled && record?.state === 'Completed' && (
        <Mutation
          title="View Certificate"
          onSubmit={async () => {
            const certificate = await learningService.certificate(material.id);
            downloadText(
              'learning-certificate.txt',
              `DEMONSTRATION CERTIFICATE\n${certificate.title}\nCompleted ${certificate.completedAt}\n${certificate.reference}`,
            );
          }}
        >
          <p>This demonstration certificate records completion of the sample learning path.</p>
        </Mutation>
      )}
    </>
  );
}
export function downloadText(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
