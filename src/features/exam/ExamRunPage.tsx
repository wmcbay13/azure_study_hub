import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, Flag, Send } from 'lucide-react'
import { content } from '@/content'
import { useProgress } from '@/progress/store'
import { isAnswered } from '@/lib/grading'
import { scoreExam } from '@/lib/exam'
import { formatClock } from '@/lib/date'
import { cn } from '@/lib/cn'
import { Button, Card, ProgressBar } from '@/components/ui'
import { QuestionView } from '@/components/question/QuestionView'

export function ExamRunPage() {
  const exam = useProgress((s) => s.activeExam)
  const update = useProgress((s) => s.updateExam)
  const finish = useProgress((s) => s.finishExam)
  const navigate = useNavigate()
  const [now, setNow] = useState(Date.now())
  const [confirming, setConfirming] = useState(false)

  const submit = useCallback(() => {
    const e = useProgress.getState().activeExam
    if (!e) return
    const result = scoreExam(e, content)
    finish(result)
    navigate(`/exam/results/${result.id}`, { replace: true })
  }, [finish, navigate])

  const remaining = exam ? exam.timeLimitSec - (now - exam.startedAt) / 1000 : 0
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (exam && remaining <= 0) submit()
  }, [exam, remaining, submit])

  if (!exam) return <Navigate to="/exam" replace />

  const q = content.questionById.get(exam.questionIds[exam.current])!
  const answeredCount = exam.questionIds.filter((id) => isAnswered(content.questionById.get(id)!, exam.answers[id])).length
  const flagged = exam.flagged.includes(q.id)
  const go = (i: number) => update({ current: Math.max(0, Math.min(exam.questionIds.length - 1, i)) })
  const unanswered = exam.questionIds.length - answeredCount

  return (
    <div className="mx-auto max-w-5xl">
      <div className="sticky top-16 z-10 -mx-4 mb-5 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-warning">Practice simulation</span>
          <span className="text-sm text-muted tabular-nums">
            Question {exam.current + 1} of {exam.questionIds.length}
          </span>
          <ProgressBar value={(answeredCount / exam.questionIds.length) * 100} className="hidden max-w-48 sm:block" label="Answered" />
          <span
            className={cn('ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-semibold tabular-nums', remaining < 300 ? 'bg-danger-soft text-danger' : 'bg-surface-2')}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock className="size-4" /> {formatClock(remaining)}
          </span>
          <Button variant="primary" size="sm" onClick={() => setConfirming(true)}>
            <Send className="size-4" /> Submit
          </Button>
        </div>
      </div>

      {confirming && (
        <Card className="mb-5 border-accent/50 p-5" role="alertdialog" aria-label="Confirm submit">
          <p className="font-semibold">Submit your exam?</p>
          <p className="mt-1 text-sm text-muted">
            {unanswered > 0 ? `${unanswered} question(s) are unanswered and will be marked incorrect. ` : 'All questions are answered. '}
            {exam.flagged.length > 0 && `${exam.flagged.length} question(s) are flagged for review.`}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={submit}>
              Submit exam
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep working
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <Card className="p-5 sm:p-6">
          <QuestionView key={q.id} question={q} value={exam.answers[q.id]} onChange={(v) => update({ answers: { ...exam.answers, [q.id]: v } })} showMeta={false} />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="ghost"
              onClick={() => update({ flagged: flagged ? exam.flagged.filter((f) => f !== q.id) : [...exam.flagged, q.id] })}
              aria-pressed={flagged}
              className={flagged ? 'text-warning' : undefined}
            >
              <Flag className={cn('size-4', flagged && 'fill-current')} /> {flagged ? 'Flagged' : 'Flag for review'}
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => go(exam.current - 1)} disabled={exam.current === 0}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              {exam.current < exam.questionIds.length - 1 ? (
                <Button variant="primary" onClick={() => go(exam.current + 1)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setConfirming(true)}>
                  Review & submit
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="h-fit p-4 lg:sticky lg:top-36">
          <p className="mb-3 text-sm font-semibold">Question map</p>
          <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-5">
            {exam.questionIds.map((id, i) => {
              const ans = isAnswered(content.questionById.get(id)!, exam.answers[id])
              const fl = exam.flagged.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => go(i)}
                  aria-label={`Question ${i + 1}${ans ? ', answered' : ''}${fl ? ', flagged' : ''}`}
                  aria-current={i === exam.current}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-lg border text-xs font-semibold tabular-nums',
                    i === exam.current ? 'border-accent ring-2 ring-accent/40' : 'border-border',
                    ans ? 'bg-accent-soft text-accent' : 'bg-surface text-muted',
                  )}
                >
                  {i + 1}
                  {fl && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warning" />}
                </button>
              )
            })}
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted">
            <p className="flex items-center gap-2">
              <span className="size-3 rounded bg-accent-soft ring-1 ring-accent/40" /> Answered ({answeredCount})
            </p>
            <p className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-warning" /> Flagged ({exam.flagged.length})
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
