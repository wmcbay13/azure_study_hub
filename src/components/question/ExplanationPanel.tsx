import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Question } from '@/content/schema'
import { content } from '@/content'
import { describeCorrect, isCorrectOption } from '@/lib/grading'
import { cn } from '@/lib/cn'
import { Callout, DocLinks, VersionNote } from '../ui'
import { Icon } from '../Icon'

/** Teaches through the question: why the answer is right, why each distractor is wrong. */
export function ExplanationPanel({ question: q, correct }: { question: Question; correct: boolean | null }) {
  const arranged = q.questionType === 'ordering' || q.questionType === 'matching'
  const others = arranged ? q.options : q.options.filter((o) => !isCorrectOption(q, o.id))
  return (
    <div className="space-y-5" aria-live="polite">
      {correct !== null && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-3 font-semibold',
            correct ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
          {correct ? 'Correct!' : 'Not quite.'}
        </div>
      )}

      <section>
        <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-success">Correct answer</h3>
        <ul className="space-y-1">
          {describeCorrect(q).map((t) => (
            <li key={t} className="flex gap-2 text-[15px] font-medium">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">Why this answer is correct</h3>
        <p className="text-[15px] leading-relaxed">{q.explanation}</p>
      </section>

      {others.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {arranged ? 'Why each item goes where it does' : 'Why the other answers are incorrect'}
          </h3>
          <ul className="space-y-2">
            {others.map((o) => (
              <li key={o.id} className="rounded-md border border-border bg-surface-2 px-4 py-3">
                <p className="text-sm font-semibold">
                  {!arranged && <XCircle className="mr-1.5 inline size-4 align-[-3px] text-danger" aria-hidden />}
                  {o.text}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{q.incorrectAnswerExplanations[o.id]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Callout color="purple" icon="brain" title="Exam takeaway">
        {q.examTakeaway}
      </Callout>

      {q.versionNote && <VersionNote>{q.versionNote}</VersionNote>}

      <div className="grid gap-5 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted">Related concepts</h3>
          <ul className="flex flex-wrap gap-2">
            {[q.topic, ...q.relatedTopics.filter((t) => t !== q.topic)].map((slug) => {
              const t = content.topicBySlug.get(slug)
              if (!t) return null
              return (
                <li key={slug}>
                  <Link to={`/topics/${slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-accent hover:text-accent">
                    <Icon name={t.icon} className="size-3.5" />
                    {t.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
        <DocLinks links={q.documentationLinks} title="Microsoft documentation" />
      </div>
    </div>
  )
}
