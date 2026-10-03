import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import type { Question } from '@/content/schema'
import { content } from '@/content'
import type { GivenAnswer } from '@/progress/types'
import { useProgress } from '@/progress/store'
import { grade, isAnswered } from '@/lib/grading'
import { cn } from '@/lib/cn'
import { Button, Card, ProgressBar, pct, scoreColor } from '../ui'
import { QuestionView } from './QuestionView'
import { ExplanationPanel } from './ExplanationPanel'

/**
 * Study mode: answer → immediate detailed explanation → next.
 * Used by the Practice page and inline on topic pages.
 */
export function StudySession({ questions, onRestart, compact = false }: { questions: Question[]; onRestart?: () => void; compact?: boolean }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, GivenAnswer>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const recordAnswer = useProgress((s) => s.recordAnswer)

  if (!questions.length) return null
  const done = index >= questions.length
  const correctCount = Object.values(results).filter(Boolean).length

  if (done) {
    const score = (correctCount / questions.length) * 100
    const missedTopics = [...new Set(questions.filter((q) => !results[q.id]).map((q) => q.topic))]
    return (
      <Card className="p-6 text-center">
        <Trophy className="mx-auto size-10" style={{ color: scoreColor(score) }} aria-hidden />
        <h3 className="mt-2 text-xl font-bold">Session complete</h3>
        <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: scoreColor(score) }}>
          {correctCount} / {questions.length} <span className="text-lg">({pct(score)})</span>
        </p>
        {missedTopics.length > 0 && (
          <div className="mx-auto mt-4 max-w-md text-left">
            <p className="mb-2 text-sm font-semibold text-muted">Review these topics:</p>
            <ul className="flex flex-wrap gap-2">
              {missedTopics.map((slug) => (
                <li key={slug}>
                  <Link to={`/topics/${slug}`} className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent">
                    {content.topicBySlug.get(slug)?.title ?? slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {onRestart && (
            <Button variant="primary" onClick={onRestart}>
              <RotateCcw className="size-4" /> New session
            </Button>
          )}
          <Button
            onClick={() => {
              setIndex(0)
              setAnswers({})
              setResults({})
            }}
          >
            Retry these questions
          </Button>
        </div>
      </Card>
    )
  }

  const q = questions[index]
  const given = answers[q.id]
  const revealed = q.id in results

  const submit = () => {
    const ok = grade(q, given)
    setResults((r) => ({ ...r, [q.id]: ok }))
    recordAnswer(q.id, ok, `${ok ? 'Correct' : 'Missed'}: ${content.topicBySlug.get(q.topic)?.title ?? q.topic} question`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-muted tabular-nums">
          Question {index + 1} of {questions.length}
        </span>
        <ProgressBar value={((index + (revealed ? 1 : 0)) / questions.length) * 100} />
        <span className="shrink-0 text-sm font-semibold tabular-nums text-success">{correctCount} ✓</span>
      </div>

      <Card className={cn('p-5 sm:p-6', compact && 'shadow-none')}>
        <QuestionView key={q.id} question={q} value={given} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} revealed={revealed} />
        <div className="mt-5 flex justify-end gap-2">
          {!revealed ? (
            <Button variant="primary" onClick={submit} disabled={!isAnswered(q, given)}>
              Check answer
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setIndex((i) => i + 1)}>
              {index + 1 === questions.length ? 'Finish' : 'Next question'} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>

      {revealed && (
        <Card className="p-5 sm:p-6">
          <ExplanationPanel question={q} correct={results[q.id]} />
        </Card>
      )}
    </div>
  )
}
