import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronDown, ChevronLeft, Clock, Flag, Target, XCircle } from 'lucide-react'
import { content, domains } from '@/content'
import { useProgress } from '@/progress/store'
import { formatDuration } from '@/lib/date'
import { encodeFilters } from '../practice/params'
import { cn } from '@/lib/cn'
import { ButtonLink, Card, CardHeader, Chip, PageHeader, pct, ProgressBar, ProgressRing, scoreColor, Stat, toneVar } from '@/components/ui'
import { QuestionView } from '@/components/question/QuestionView'
import { ExplanationPanel } from '@/components/question/ExplanationPanel'
import { NotFoundPage } from '../NotFoundPage'

type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'flagged'

export function ExamResultsPage() {
  const { id } = useParams()
  const exam = useProgress((s) => s.exams.find((e) => e.id === id))
  const [filter, setFilter] = useState<ReviewFilter>('incorrect')
  const [open, setOpen] = useState<string | null>(null)

  const byTopic = useMemo(() => {
    if (!exam) return []
    const m = new Map<string, { correct: number; total: number }>()
    for (const qid of exam.questionIds) {
      const q = content.questionById.get(qid)
      if (!q) continue
      const t = m.get(q.topic) ?? { correct: 0, total: 0 }
      t.total++
      if (exam.correct[qid]) t.correct++
      m.set(q.topic, t)
    }
    return [...m.entries()].map(([slug, v]) => ({ slug, ...v, pct: (v.correct / v.total) * 100 })).sort((a, b) => a.pct - b.pct)
  }, [exam])

  if (!exam) return <NotFoundPage what="exam result" />
  const correctCount = Object.values(exam.correct).filter(Boolean).length
  const weak = byTopic.filter((t) => t.pct < 70)
  const list = exam.questionIds.filter((qid) =>
    filter === 'all' ? true : filter === 'flagged' ? exam.flagged.includes(qid) : filter === 'correct' ? exam.correct[qid] : !exam.correct[qid],
  )

  return (
    <div>
      <Link to="/exam" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ChevronLeft className="size-4" /> Practice Exams
      </Link>
      <PageHeader
        title="Practice exam results"
        description={`Completed ${new Date(exam.finishedAt).toLocaleString()}. This is a practice simulation; the percentage is not the scaled score used by Microsoft.`}
      />

      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <Card className="flex flex-col items-center justify-center p-6">
          <ProgressRing value={exam.score} size={160} stroke={14} color={scoreColor(exam.score)} label="Overall score">
            <div>
              <div className="text-4xl font-semibold tabular-nums" style={{ color: scoreColor(exam.score) }}>
                {pct(exam.score)}
              </div>
              <div className="text-xs text-muted">overall</div>
            </div>
          </ProgressRing>
          <p className="mt-3 text-sm text-muted">
            {correctCount} of {exam.questionIds.length} correct
          </p>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon="circle-check" color="green" label="Correct" value={correctCount} />
          <Stat icon="ban" color="red" label="Incorrect or unanswered" value={exam.questionIds.length - correctCount} />
          <Stat icon="clock" color="blue" label="Time spent" value={formatDuration(exam.durationSec)} hint={`of ${formatDuration(exam.timeLimitSec)}`} />
          <Card className="sm:col-span-3">
            <CardHeader title="Accuracy by domain" />
            <ul className="space-y-3 p-5">
              {domains.map((d) => {
                const s = exam.byDomain[d.id]
                if (!s) return null
                const p = (s.correct / s.total) * 100
                return (
                  <li key={d.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate font-medium">{d.shortName}</span>
                    <ProgressBar value={p} color={toneVar(d.color, 'mk')} label={`${d.shortName} accuracy`} />
                    <span className="w-24 text-right tabular-nums text-muted">
                      {s.correct}/{s.total} · <strong style={{ color: scoreColor(p) }}>{pct(p)}</strong>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Accuracy by topic" subtitle="Lowest first" />
          <ul className="max-h-80 divide-y divide-border overflow-y-auto px-5 pb-3">
            {byTopic.map((t) => (
              <li key={t.slug} className="flex items-center gap-3 py-2 text-sm">
                <Link to={`/topics/${t.slug}`} className="flex-1 truncate hover:text-accent">
                  {content.topicBySlug.get(t.slug)?.title ?? t.slug}
                </Link>
                <span className="tabular-nums text-muted">
                  {t.correct}/{t.total}
                </span>
                <span className="w-12 text-right font-semibold tabular-nums" style={{ color: scoreColor(t.pct) }}>
                  {pct(t.pct)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recommended next steps" icon={<Target className="size-4 text-accent" />} />
          <div className="space-y-3 p-5">
            {weak.length ? (
              <>
                <p className="text-sm text-muted">These topics scored under 70%. Re-study them, then drill with targeted questions:</p>
                <ul className="space-y-2">
                  {weak.slice(0, 6).map((t) => (
                    <li key={t.slug} className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                      <Link to={`/topics/${t.slug}`} className="font-medium hover:text-accent">
                        {content.topicBySlug.get(t.slug)?.title}
                      </Link>
                      <Link to={`/practice/session?${encodeFilters({ topics: [t.slug], count: 10 })}`} className="shrink-0 text-accent hover:underline">
                        Practice →
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">No topic scored under 70% — great work. Take another exam to confirm consistency.</p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <ButtonLink to="/exam" variant="primary">
                New practice exam
              </ButtonLink>
              <ButtonLink to="/progress">View weak areas</ButtonLink>
            </div>
          </div>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Review questions</h2>
          <div className="flex flex-wrap gap-2">
            {(['incorrect', 'correct', 'flagged', 'all'] as const).map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
        <ul className="space-y-2">
          {list.map((qid) => {
            const q = content.questionById.get(qid)
            if (!q) return null
            const ok = exam.correct[qid]
            const isOpen = open === qid
            const n = exam.questionIds.indexOf(qid) + 1
            return (
              <li key={qid}>
                <Card className="overflow-hidden">
                  <button onClick={() => setOpen(isOpen ? null : qid)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={isOpen}>
                    {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />}
                    <span className="flex-1">
                      <span className="text-xs text-subtle">
                        Q{n} · {content.topicBySlug.get(q.topic)?.title}
                        {exam.flagged.includes(qid) && (
                          <span className="ml-2 inline-flex items-center gap-1 text-warning">
                            <Flag className="size-3 fill-current" /> flagged
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 block text-sm font-medium">{q.question}</span>
                    </span>
                    <ChevronDown className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="space-y-6 border-t border-border p-5">
                      <QuestionView question={q} value={exam.answers[qid] ?? null} onChange={() => {}} revealed />
                      {!exam.answers[qid] && <p className="text-sm font-medium text-danger">You did not answer this question.</p>}
                      <ExplanationPanel question={q} correct={ok} />
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
          {list.length === 0 && <p className="py-6 text-center text-sm text-muted">No questions in this view.</p>}
        </ul>
      </section>
      <p className="mt-6 flex items-center gap-1.5 text-xs text-subtle">
        <Clock className="size-3.5" /> Practice simulation — not an official Microsoft exam.
      </p>
    </div>
  )
}
