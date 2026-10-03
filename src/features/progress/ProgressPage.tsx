import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Play, Trash2, Upload } from 'lucide-react'
import { content, domains } from '@/content'
import { progressSnapshot, useProgress } from '@/progress/store'
import { domainStats, streak, topicStats, totals, weakTopics } from '@/progress/analytics'
import { formatDuration } from '@/lib/date'
import { encodeFilters } from '../practice/params'
import { Button, ButtonLink, Card, CardHeader, EmptyState, PageHeader, pct, scoreColor, Stat, toneVar } from '@/components/ui'
import { BarList, ScoreTrend, StudyCalendar } from '@/components/charts'
import { StatusBadge } from '@/components/StatusPicker'

const practiceLink = (f: Parameters<typeof encodeFilters>[0]) => `/practice/session?${encodeFilters(f)}`

export function ProgressPage() {
  const progress = useProgress()
  const dstats = useMemo(() => domainStats(progress, content), [progress])
  const tstats = useMemo(() => topicStats(progress, content), [progress])
  const t = totals(progress)
  const { current, longest } = streak(progress.studyDays)
  const weak = weakTopics(tstats, 10)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const unseen = content.flashcards.length - t.cardsReviewed
  const attempted = tstats.filter((s) => s.accuracy.attempts > 0).sort((a, b) => (a.accuracy.pct ?? 0) - (b.accuracy.pct ?? 0))

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progressSnapshot(useProgress.getState()), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `azure-study-hub-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !('questionAttempts' in data)) throw new Error('not a progress file')
      useProgress.getState().importProgress(data)
      setMsg('Progress imported.')
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="activity"
        title="Study Progress"
        description="Accuracy by domain and topic, weak areas, flashcard mastery and exam trends. Progress is saved in this browser."
        actions={
          <>
            <Button size="sm" onClick={exportData}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => confirm('Reset all study progress in this browser? This cannot be undone.') && useProgress.getState().reset()}
            >
              <Trash2 className="size-4" /> Reset
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </>
        }
      />
      {msg && <p className="rounded-xl bg-accent-soft px-4 py-2 text-sm text-accent">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon="circle-check" color="green" label="Correct answers" value={t.totalCorrect} />
        <Stat icon="circle-x" color="red" label="Incorrect answers" value={t.totalAttempts - t.totalCorrect} />
        <Stat icon="timer" color="blue" label="Study time" value={formatDuration(progress.studySeconds)} />
        <Stat icon="flame" color="orange" label="Current streak" value={`${current} days`} hint={`longest ${longest}`} />
      </div>

      <Card>
        <CardHeader title="Weak areas by domain" subtitle="Question accuracy per AZ-104 domain — launch targeted practice from any row" />
        <div className="p-5">
          <BarList
            rows={dstats.map((s) => {
              const d = domains.find((x) => x.id === s.id)!
              return {
                id: s.id,
                label: d.shortName,
                value: s.accuracy.pct,
                color: toneVar(d.color, 'mk'),
                detail: `${s.accuracy.correct}/${s.accuracy.attempts} correct`,
                action: (
                  <Link to={practiceLink({ domains: [s.id], count: 10 })} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:border-accent hover:text-accent">
                    <Play className="size-3" /> Practice
                  </Link>
                ),
              }
            })}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Weak topics"
            subtitle="Below 75% accuracy or marked Needs Review"
            action={weak.length > 0 && <ButtonLink size="sm" variant="primary" to={practiceLink({ source: 'weak', count: 15 })}>Practice all</ButtonLink>}
          />
          <div className="p-5">
            {weak.length ? (
              <ul className="divide-y divide-border">
                {weak.map((s) => (
                  <li key={s.topic.slug} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                    <Link to={`/topics/${s.topic.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">
                      {s.topic.title}
                    </Link>
                    <StatusBadge status={s.status} />
                    <span className="w-12 text-right font-semibold tabular-nums" style={{ color: scoreColor(s.accuracy.pct) }}>
                      {pct(s.accuracy.pct)}
                    </span>
                    <Link to={practiceLink({ topics: [s.topic.slug], count: 10 })} className="text-xs font-medium text-accent hover:underline">
                      Practice →
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="target" title="No weak topics yet">
                Answer a few questions per topic and they'll be measured here.
              </EmptyState>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Flashcard mastery" />
          <div className="space-y-4 p-5">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${t.cardsKnown} known, ${t.cardsReview} need review, ${unseen} not seen`}>
              <div style={{ width: `${(t.cardsKnown / content.flashcards.length) * 100}%`, background: 'var(--success)' }} />
              <div className="border-l-2 border-surface" style={{ width: `${(t.cardsReview / content.flashcards.length) * 100}%`, background: 'var(--warning)' }} />
            </div>
            <ul className="grid grid-cols-3 gap-2 text-center text-sm">
              <li className="rounded-xl bg-success-soft p-3">
                <div className="text-xl font-bold tabular-nums">{t.cardsKnown}</div>
                <div className="text-xs text-muted">Known</div>
              </li>
              <li className="rounded-xl bg-warning-soft p-3">
                <div className="text-xl font-bold tabular-nums">{t.cardsReview}</div>
                <div className="text-xs text-muted">Needs review</div>
              </li>
              <li className="rounded-xl bg-surface-2 p-3">
                <div className="text-xl font-bold tabular-nums">{unseen}</div>
                <div className="text-xs text-muted">Not seen</div>
              </li>
            </ul>
            <ButtonLink to="/flashcards" size="sm">
              Review flashcards
            </ButtonLink>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Practice exam scores" />
          <div className="p-5">
            {progress.exams.length ? <ScoreTrend exams={progress.exams} /> : <EmptyState icon="clock" title="No practice exams yet" />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Study streak" subtitle={`${progress.studyDays.length} total study days`} />
          <div className="p-5">
            <StudyCalendar days={progress.studyDays} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Accuracy by topic" subtitle={`${attempted.length} of ${content.topics.length} topics attempted`} />
        <div className="overflow-x-auto p-5">
          {attempted.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-subtle">
                  <th className="pb-2 font-semibold">Topic</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Answered</th>
                  <th className="pb-2 text-right font-semibold">Correct / attempts</th>
                  <th className="pb-2 text-right font-semibold">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {attempted.map((s) => (
                  <tr key={s.topic.slug} className="border-t border-border">
                    <td className="py-2">
                      <Link to={`/topics/${s.topic.slug}`} className="hover:text-accent">
                        {s.topic.title}
                      </Link>
                    </td>
                    <td className="py-2">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.accuracy.answered}</td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {s.accuracy.correct} / {s.accuracy.attempts}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums" style={{ color: scoreColor(s.accuracy.pct) }}>
                      {pct(s.accuracy.pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon="list-ordered" title="No topics attempted yet" />
          )}
        </div>
      </Card>
    </div>
  )
}
