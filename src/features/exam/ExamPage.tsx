import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Flag, ListChecks, Play, RotateCcw } from 'lucide-react'
import { content, domains } from '@/content'
import { useProgress } from '@/progress/store'
import { pickExamQuestions } from '@/lib/session'
import { uid } from '@/lib/random'
import { formatDuration } from '@/lib/date'
import { Button, Card, CardHeader, Chip, EmptyState, PageHeader, pct, scoreColor } from '@/components/ui'

const LENGTHS = [
  { count: 20, minutes: 30, label: 'Short' },
  { count: 40, minutes: 60, label: 'Standard' },
  { count: 50, minutes: 100, label: 'Full length' },
]

export function ExamPage() {
  const navigate = useNavigate()
  const exams = useProgress((s) => s.exams)
  const active = useProgress((s) => s.activeExam)
  const startExam = useProgress((s) => s.startExam)
  const abandon = useProgress((s) => s.abandonExam)
  const [len, setLen] = useState(1)

  const start = () => {
    const { count, minutes } = LENGTHS[len]
    const qs = pickExamQuestions(content, Math.min(count, content.questions.length))
    startExam({ id: uid(), startedAt: Date.now(), timeLimitSec: minutes * 60, questionIds: qs.map((q) => q.id), answers: {}, flagged: [], current: 0 })
    navigate('/exam/run')
  }

  return (
    <div>
      <PageHeader
        icon="clock"
        title="Practice Exams"
        description="A timed simulation of the exam experience: no feedback until you submit, question navigation, and flag-for-review. Afterwards, review every question with full explanations."
      />

      <div className="mb-6 flex gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <p>
          <strong>Practice simulation — not an official Microsoft exam.</strong> Questions are original and written for learning. Real exam
          length, question formats, time limits and scaled scoring differ; see the official{' '}
          <a className="text-accent underline" href="https://learn.microsoft.com/credentials/certifications/azure-administrator/" target="_blank" rel="noreferrer">
            certification page
          </a>{' '}
          for current details.
        </p>
      </div>

      {active && (
        <Card className="mb-6 flex flex-col gap-3 border-accent/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">You have an exam in progress</p>
            <p className="text-sm text-muted">
              {Object.keys(active.answers).length} of {active.questionIds.length} answered
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => navigate('/exam/run')}>
              Resume exam
            </Button>
            <Button variant="ghost" onClick={() => confirm('Discard the exam in progress?') && abandon()}>
              Discard
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Start a practice exam</h2>
          <p className="mt-1 text-sm text-muted">Questions are drawn from every domain in proportion to its weight on the skills outline.</p>
          <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Exam length">
            {LENGTHS.map((l, i) => (
              <Chip key={l.label} active={len === i} onClick={() => setLen(i)} role="radio" aria-checked={len === i}>
                {l.label}: {l.count} questions · {l.minutes} min
              </Chip>
            ))}
          </div>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-accent" /> Countdown timer; the exam submits automatically at zero.
            </li>
            <li className="flex items-center gap-2">
              <Flag className="size-4 text-accent" /> Flag questions and jump between them from the question map.
            </li>
            <li className="flex items-center gap-2">
              <ListChecks className="size-4 text-accent" /> Results by domain and topic, then a full review.
            </li>
          </ul>
          <div className="mt-6 grid grid-cols-5 gap-1 text-center text-[11px] text-muted">
            {domains.map((d) => (
              <div key={d.id} className="rounded-lg bg-surface-2 p-2">
                <div className="font-semibold text-text">{d.weight}</div>
                {d.shortName}
              </div>
            ))}
          </div>
          <Button variant="primary" size="lg" className="mt-6 w-full sm:w-auto" onClick={start} disabled={!!active}>
            <Play className="size-4" /> Start {LENGTHS[len].label.toLowerCase()} exam
          </Button>
        </Card>

        <Card>
          <CardHeader title="Exam history" icon={<RotateCcw className="size-4 text-accent" />} subtitle={exams.length ? `${exams.length} attempts` : undefined} />
          <div className="p-5">
            {exams.length === 0 ? (
              <EmptyState icon="trophy" title="No practice exams yet.">
                Your scores will appear here.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {exams.map((e) => (
                  <li key={e.id}>
                    <Link to={`/exam/results/${e.id}`} className="flex items-center gap-4 py-3 hover:text-accent">
                      <span className="w-14 text-xl font-bold tabular-nums" style={{ color: scoreColor(e.score) }}>
                        {pct(e.score)}
                      </span>
                      <span className="flex-1 text-sm">
                        <span className="block font-medium">{new Date(e.finishedAt).toLocaleString()}</span>
                        <span className="text-muted">
                          {e.questionIds.length} questions · {formatDuration(e.durationSec)}
                        </span>
                      </span>
                      <span className="text-sm text-accent">Review →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
