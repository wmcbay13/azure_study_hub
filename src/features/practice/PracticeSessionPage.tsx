import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { content, getDomain } from '@/content'
import { useProgress } from '@/progress/store'
import { filterQuestions, pickQuestions } from '@/lib/session'
import { difficultyLabel, EmptyState, ButtonLink, Badge } from '@/components/ui'
import { StudySession } from '@/components/question/StudySession'
import { decodeFilters } from './params'

export function PracticeSessionPage() {
  const [params] = useSearchParams()
  const [round, setRound] = useState(0)
  const single = params.get('q')
  const filters = useMemo(() => decodeFilters(params), [params])

  // Pick once per round: answering questions must not reshuffle the session.
  const questions = useMemo(() => {
    if (single) {
      const q = content.questionById.get(single)
      return q ? [q] : []
    }
    const pool = filterQuestions(content, useProgress.getState(), filters)
    return pickQuestions(pool, filters.count)
  }, [single, filters, round])

  const labels = [
    ...(filters.domains ?? []).map((d) => getDomain(d).shortName),
    ...(filters.topics ?? []).map((t) => content.topicBySlug.get(t)?.title ?? t),
    ...(filters.services ?? []).map((s) => content.serviceById.get(s)?.name ?? s),
    ...(filters.difficulties ?? []).map(difficultyLabel),
    ...(filters.source && filters.source !== 'all' ? [filters.source === 'weak' ? 'Weak areas' : filters.source === 'incorrect' ? 'Previously incorrect' : 'Unanswered'] : []),
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
          <ChevronLeft className="size-4" /> Practice setup
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <Badge color="blue">Study mode</Badge>
          {!single && labels.map((l) => <Badge key={l}>{l}</Badge>)}
        </div>
      </div>
      {questions.length ? (
        <StudySession key={round} questions={questions} onRestart={single ? undefined : () => setRound((r) => r + 1)} />
      ) : (
        <EmptyState icon="target" title="No questions match this session.">
          <p className="mb-4">Try widening your filters.</p>
          <ButtonLink to="/practice" variant="primary">
            Back to setup
          </ButtonLink>
        </EmptyState>
      )}
    </div>
  )
}
